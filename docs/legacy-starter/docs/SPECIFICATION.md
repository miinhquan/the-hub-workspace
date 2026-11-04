# The Hub Workspace — Product & Technical Specification

**Version:** 0.2 (product specification update; starter UI remains v0.1)  
**Product:** Private operating console for The Hub Hanoi  
**Primary user:** Owner/operator  
**Locale:** Vietnamese operations; English-facing customer data and tour names supported  
**Currency:** VND  
**Brand:** `#0546ac`, Saira typography, clean compact SaaS interface

## 1. Product objective
A private, low-overhead workspace to manage customer conversations as work items, tour/ticket/laundry bookings, customer records, POS transaction imports and finance preparation. It is not intended to become a KPI-heavy enterprise CRM.

## 2. Confirmed decisions
- Zalo: personal account, not Zalo Official Account.
- POS: Android POS terminal; exact vendor/model and export schema not yet supplied.
- AI: persistent right-hand sidebar on desktop; responsive collapse on smaller screens.
- Business context: The Hub Hanoi, combining self-service laundry and travel/booking-office services.
- Initial brand styling: blue `#0546ac`, Saira.

## 3. Scope
### V1 — operational core
1. Private authentication and owner-only access (production requirement; not included in local starter).
2. Overview with compact operational counts and current-month net imported sales.
3. Inbox/contact hub: customer list, channel, phone/email, saved deep link to external conversation.
4. Customers: create, search, edit, contact history.
5. **Inquiries:** capture genuine tour enquiries separately from bookings; link each inquiry to a customer and source channel; track status and last meaningful activity.
6. **Inquiry Auto-Archive:** automatically soft-archive an active inquiry after 48 consecutive hours without meaningful activity. Keep the inquiry and all activity events; never hard-delete it. Provide Restore for an auto-archived inquiry.
7. **Booking Log:** create a booking when the customer is ready to place an order. Track operator requests separately so a `NO SLOT` result for one operator does not close the customer's overall request. Core outcomes include `BOOKED`, `NO SLOT`, and customer-side `CANCELLED`.
8. Booking records: reference, customer, linked inquiry, service/tour, date, passengers, operator, status, price/cost, payment status and Hub invoice reference.
9. POS import: CSV intake, preview, basic column recognition, preserve raw source rows, normalize transaction date, description, amount, payment method, type and category.
10. Finance: monthly gross sales, refunds and net sales; CSV export. Future work: expense import, gateway fees, refunds reconciliation, direct costs and gross margin.
11. AI Copilot shell on right: context-aware assistant; production integration must use a server-side API route and never expose provider API keys in browser code.
12. JSON backup/restore in starter build.

### Inquiry lifecycle and inactivity policy (confirmed)
- Create an Inquiry when a real customer request is worth tracking; merely opening a conversation or receiving a generic notification does not automatically create one. AI may suggest creation, but the owner confirms it.
- Inquiry statuses: `New`, `Quoted`, `Following Up`, `Waiting Customer`, `Waiting Operator`, `Ready to Book`, `Converted`, `Archived`, `Lost`, `Cancelled`.
- The inactivity clock is based on `last_activity_at`, not record creation time. The configured threshold for The Hub is **48 hours**.
- Meaningful activity that resets the clock: customer message received, owner reply sent/recorded, quotation sent, operator reply recorded, inquiry details changed, or a substantive note/follow-up recorded.
- Non-activity that does not reset the clock: opening/viewing a record, a notification arriving without a message, background sync, automatic reminder, or the auto-archive event itself.
- At 48 hours with no meaningful activity, the system sets `archived_at`, stores the prior status, marks the inquiry `Archived` with reason `inactivity_timeout`, and writes an `auto_archived` Activity Log event. The record disappears from the active inquiry list but remains searchable in Archived.
- **Soft archive only:** no inquiry, customer, booking, or Activity Log row is physically deleted by this rule.
- Restore is available on an auto-archived inquiry. Restore returns it to the status it had immediately before auto-archive, clears the active archive marker, sets `last_activity_at` to the restore time (restarting the 48-hour clock), and writes a `restored` Activity Log event. The earlier `auto_archived` event remains in history.
- **Never apply this timer to a Booking.** In particular, a booking waiting for operator confirmation and a `BOOKED` booking are excluded. An inquiry linked to an active operator request (`Pending`) or a successful operator booking (`Booked`) is also protected from auto-archive. Once an inquiry has been converted into a booking, the inquiry timer stops; the booking is managed by Booking Log and must not silently disappear.
- `NO SLOT` closes only the relevant Operator Request. It must not automatically archive or cancel the customer's overall inquiry/booking; another operator may be tried.
- Customer-side `CANCELLED`, `Lost`, or manually closed inquiries may be archived explicitly, with the reason recorded. They are not treated as inactivity auto-archives.

### V2 — integrations and automation
- Zalo: evaluate browser-assisted notifications or supported partner/official API path. Personal Zalo has no supported public webhook contract equivalent to Zalo OA. Do not promise automated message ingestion until an approved integration path is tested and compliant with platform terms.
- WhatsApp: connect WhatsApp Business Platform / Cloud API if the business account is eligible and user opts in. Render CRM-native inbox from webhook events; do not iframe WhatsApp Web.
- POS: implement exact adapter after receiving anonymized Android POS export sample(s), including sales, refunds, settlement, payment method and fees.
- AI: secure assistant with read-only tools first (search bookings/customers, summarize, classify imported POS rows); add write tools only with explicit user confirmation and audit log.
- Notifications: email/browser notifications based on verified message events; do not poll personal account pages or collect session cookies.

## 4. Messaging constraints
A Zalo personal account cannot be assumed to provide business webhooks or embeddable chat. V1 stores a user-provided profile/conversation URL and opens it in Zalo. Notification automation is blocked pending a supported, stable integration. Zalo OA is a different product and may offer API/webhook capabilities subject to OA setup and permissions. WhatsApp Business Cloud API is the preferred route for a future first-party CRM inbox if enabled.

## 5. POS import and accounting data model
Canonical transaction fields:
- `source_file_id`, `source_row_number`, `external_transaction_id`
- `occurred_at`, `description`, `item_name`, `category`
- `gross_amount`, `discount_amount`, `refund_amount`, `net_amount`, `currency`
- `payment_method`, `transaction_type` (sale/refund/void/fee/settlement)
- `cashier_or_terminal`, `raw_payload`, `import_batch_id`

Import must be idempotent where a stable POS transaction ID exists. If no ID exists, dedupe must use a conservative composite key and flag possible duplicates rather than silently dropping them. Preserve original file and raw rows. No accounting/tax treatment should be inferred from ambiguous columns.

## 6. Recommended production architecture
- Frontend: Next.js (App Router) + TypeScript + Tailwind; responsive desktop-first UI.
- Backend/data: Supabase Postgres, Auth, Storage, Row Level Security.
- Hosting: Cloudflare Pages/Workers or Vercel; deploy CRM independently on a private subdomain such as `workspace.<owned-domain>` once domain/DNS ownership is confirmed.
- Access: Supabase Auth with MFA; optionally Cloudflare Access as an additional gate. `noindex` and an obscure URL are supplementary only, never authentication.
- AI: server-side API route to OpenAI API, with secrets in server environment variables, per-user authorization, scoped tool functions and audit logging. ChatGPT Plus subscription/session is not embedded or reused; API usage is billed separately.
- Integrations: webhook endpoints for supported provider events; encrypted secret storage; retry queue and event deduplication.

## 7. Security and privacy requirements
- Production records must be stored server-side with RLS enabled on every tenant table.
- Default single-tenant workspace for The Hub; only owner account initially.
- MFA recommended; short-lived sessions; server-side authorization on every mutation.
- No API keys, provider tokens, or POS credentials in browser storage or frontend source.
- Audit log for imports, edits, exports and AI-triggered actions.
- Backups and retention policy; never treat localStorage as a production database.
- Do not import full payment-card data or sensitive authentication credentials from POS exports.

## 8. Acceptance criteria for production V1
- Owner can sign in and access only The Hub workspace.
- Customers, inquiries, bookings and activity history persist across devices and sessions.
- Each customer can hold a channel and external chat deep link.
- An inquiry with no meaningful activity for 48 hours is soft-archived and removed from the active list; its record and full Activity Log remain available.
- Restore returns an auto-archived inquiry to its previous status, records the restore event and resets `last_activity_at` to the restore timestamp.
- Viewing a record, receiving a background notification, or running an automatic reminder does not reset the 48-hour inactivity clock.
- No auto-archive job can archive a Booking, including bookings waiting for operator confirmation or already `BOOKED`; active/pending operator requests also protect the linked inquiry. Conversion to Booking stops the inquiry timer.
- A `NO SLOT` outcome is scoped to one Operator Request and does not delete or close the customer request.
- Activity Log records creation, meaningful changes, quote/follow-up events, auto-archive, restore, conversion to booking and operator outcomes.
- POS CSV import supports confirmed vendor export format, preview, validation, error reporting and duplicate handling.
- Monthly sales/refund totals reconcile to the imported source under documented rules.
- Exported monthly ledger can be opened in Excel.
- AI sidebar can answer using authorized workspace records; all write actions require confirmation.
- No secret is exposed in frontend bundle; RLS and auth tests pass.

## 9. Open implementation inputs
1. Android POS vendor/model and one anonymized export sample (CSV/XLSX/PDF).
2. Whether WhatsApp is currently WhatsApp Business App or WhatsApp Business Platform.
3. Domain currently owned and DNS provider to choose the production subdomain.
4. Zalo personal-account integration approach: manual deep link for V1; any third-party connector must be reviewed for account security and platform compliance before use.
