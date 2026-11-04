-- Supabase PostgreSQL starter schema for The Hub Workspace.
-- Apply only after creating a Supabase project and configuring Auth.
create extension if not exists pgcrypto;
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  channel text,
  chat_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  service text not null,
  booking_date date,
  status text not null default 'Enquiry' check (status in ('Enquiry','Pending','Confirmed','Cancelled','Completed')),
  amount numeric(14,2) not null default 0,
  currency text not null default 'VND',
  channel text,
  operator_name text,
  operator_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_sha256 text,
  source_system text,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  status text not null default 'preview',
  imported_at timestamptz not null default now()
);
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references public.import_batches(id) on delete set null,
  external_transaction_id text,
  source_row_number integer,
  occurred_at timestamptz,
  description text,
  item_name text,
  category text,
  gross_amount numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  refund_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  currency text not null default 'VND',
  payment_method text,
  transaction_type text not null default 'sale' check (transaction_type in ('sale','refund','void','fee','settlement','unknown')),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists transactions_source_id_unique
  on public.transactions(external_transaction_id) where external_transaction_id is not null;
create index if not exists bookings_date_idx on public.bookings(booking_date);
create index if not exists transactions_occurred_at_idx on public.transactions(occurred_at);

-- Single-owner starter policy. Replace with workspace membership policies before multi-user support.
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.import_batches enable row level security;
alter table public.transactions enable row level security;
-- Authenticated users only; for production, additionally bind each row to workspace_id
-- and restrict membership to the approved The Hub owner account.
create policy "authenticated users can manage customers" on public.customers for all to authenticated using (true) with check (true);
create policy "authenticated users can manage bookings" on public.bookings for all to authenticated using (true) with check (true);
create policy "authenticated users can manage import batches" on public.import_batches for all to authenticated using (true) with check (true);
create policy "authenticated users can manage transactions" on public.transactions for all to authenticated using (true) with check (true);

-- Inquiries are tracked separately from bookings. The 48-hour inactivity policy
-- soft-archives only inquiries; it never deletes records and never archives bookings.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  channel text,
  subject text,
  destination text,
  requested_date date,
  passenger_count integer check (passenger_count is null or passenger_count >= 0),
  status text not null default 'New' check (status in (
    'New','Quoted','Following Up','Waiting Customer','Waiting Operator',
    'Ready to Book','Converted','Archived','Lost','Cancelled'
  )),
  status_before_archive text,
  last_activity_at timestamptz not null default now(),
  auto_archive_after_hours integer not null default 48 check (auto_archive_after_hours > 0),
  archived_at timestamptz,
  archive_reason text check (archive_reason is null or archive_reason in (
    'inactivity_timeout','manual','lost','cancelled'
  )),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists inquiry_id uuid references public.inquiries(id) on delete set null;

create table if not exists public.operator_requests (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references public.inquiries(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  operator_name text not null,
  status text not null default 'Pending' check (status in ('Pending','Booked','No Slot','Cancelled')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  operator_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (inquiry_id is not null or booking_id is not null)
);

create table if not exists public.inquiry_activity (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete restrict,
  event_type text not null,
  actor_type text not null default 'user' check (actor_type in ('user','customer','operator','system','ai')),
  actor_label text,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists inquiries_active_last_activity_idx
  on public.inquiries(last_activity_at)
  where archived_at is null;
create index if not exists inquiries_customer_idx on public.inquiries(customer_id);
create index if not exists inquiry_activity_inquiry_time_idx
  on public.inquiry_activity(inquiry_id, occurred_at desc);
create index if not exists operator_requests_inquiry_idx on public.operator_requests(inquiry_id);

-- Only substantive interactions reset the inactivity clock. System reminders,
-- record views and auto-archive events are deliberately excluded.
create or replace function public.bump_inquiry_last_activity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.event_type in (
    'customer_message_received',
    'owner_reply_recorded',
    'quotation_sent',
    'operator_reply_recorded',
    'details_updated',
    'note_added',
    'follow_up_recorded',
    'restored'
  ) then
    update public.inquiries
       set last_activity_at = new.occurred_at,
           updated_at = now()
     where id = new.inquiry_id;
  end if;
  return new;
end;
$$;

drop trigger if exists inquiry_activity_bump_last_activity on public.inquiry_activity;
create trigger inquiry_activity_bump_last_activity
after insert on public.inquiry_activity
for each row execute function public.bump_inquiry_last_activity();

-- Run periodically from Supabase Cron / a scheduled Edge Function (recommended every 5 minutes).
-- Safe to run repeatedly: only currently active, stale inquiries are changed.
create or replace function public.archive_stale_inquiries()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  archived_count integer;
begin
  with stale as (
    update public.inquiries i
       set status_before_archive = i.status,
           status = 'Archived',
           archived_at = now(),
           archive_reason = 'inactivity_timeout',
           updated_at = now()
     where i.archived_at is null
       and i.status not in ('Waiting Operator','Converted','Archived','Lost','Cancelled')
       and i.last_activity_at <= now() - make_interval(hours => i.auto_archive_after_hours)
       and not exists (
         select 1
           from public.bookings b
          where b.inquiry_id = i.id
            and b.status in ('Pending','Confirmed')
       )
       and not exists (
         select 1
           from public.operator_requests r
          where r.inquiry_id = i.id
            and r.status in ('Pending','Booked')
       )
     returning i.id, i.last_activity_at
  )
  insert into public.inquiry_activity (inquiry_id, event_type, actor_type, description, metadata)
  select id, 'auto_archived', 'system',
         'Inquiry automatically archived after 48 hours without meaningful activity.',
         jsonb_build_object('reason','inactivity_timeout','threshold_hours',48,'last_activity_at',last_activity_at)
    from stale;

  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

-- Restore only auto-archived inquiries. The trigger on inquiry_activity sets
-- last_activity_at to the restore event time, restarting the inactivity window.
create or replace function public.restore_auto_archived_inquiry(p_inquiry_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  prior_status text;
begin
  update public.inquiries
     set status = coalesce(status_before_archive, 'New'),
         status_before_archive = null,
         archived_at = null,
         archive_reason = null,
         updated_at = now()
   where id = p_inquiry_id
     and archived_at is not null
     and archive_reason = 'inactivity_timeout'
  returning status into prior_status;

  if not found then
    raise exception 'Inquiry % is not currently auto-archived', p_inquiry_id;
  end if;

  insert into public.inquiry_activity (inquiry_id, event_type, actor_type, description, metadata)
  values (
    p_inquiry_id,
    'restored',
    'user',
    'Inquiry restored from auto-archive; 48-hour inactivity timer restarted.',
    jsonb_build_object('restored_status', prior_status, 'timer_reset_at', now())
  );
end;
$$;

alter table public.inquiries enable row level security;
alter table public.operator_requests enable row level security;
alter table public.inquiry_activity enable row level security;

drop policy if exists "authenticated users can manage inquiries" on public.inquiries;
create policy "authenticated users can manage inquiries" on public.inquiries
  for all to authenticated using (true) with check (true);
drop policy if exists "authenticated users can manage operator requests" on public.operator_requests;
create policy "authenticated users can manage operator requests" on public.operator_requests
  for all to authenticated using (true) with check (true);
drop policy if exists "authenticated users can read and append inquiry activity" on public.inquiry_activity;
create policy "authenticated users can read and append inquiry activity" on public.inquiry_activity
  for all to authenticated using (true) with check (true);

grant execute on function public.restore_auto_archived_inquiry(uuid) to authenticated;
-- archive_stale_inquiries() should be invoked only by the trusted scheduler/service role.
