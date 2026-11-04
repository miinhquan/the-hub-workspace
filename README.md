# Current WhatsApp integration (04 November 2026)

Read [receive-only WhatsApp setup and test status](docs/WHATSAPP-SETUP.vi.md). Workspace receives live messages, stores conversations in D1 and links them to inquiries. Replies stay in the WhatsApp app through Open WhatsApp. There is no composer and Graph writes/send requests are disabled. App echoes are retained when Meta provides them. META_APP_SECRET is required; an access token is optional for read-only configuration checks. Real Meta delivery/coexistence is not verified until webhook setup is completed.

# The Hub Workspace

Current access: [Workspace password accounts](docs/ACCOUNTS.md) supersede earlier ChatGPT-only/Access-JWT access notes. No self signup; admin creates staff accounts.


Latest workflow: [4 November ticket, expense and timer rules](docs/WORKFLOW-2026-11-04.md) supersede earlier status notes.


**Control Center revision:** see [current implementation status](docs/V2-IMPLEMENTATION-STATUS.md). This status supersedes conflicting older descriptions below. Latest revision removes the left navigation and is approved for owner-private publication.


Private operations workspace for The Hub, 48 Thuốc Bắc, Hanoi. This is a separate server application from the public thehub.express website.

## Included

- Customers and external WhatsApp / personal Zalo conversation links.
- Inquiries with statuses, meaningful activity notes, recoverable archive after 48 hours of inactivity, and Restore with a fresh timer.
- Inquiries convert once into separate Bookings. Existing bookings and active operator work protect inquiry records from automatic archiving.
- Multiple operator requests per booking. NO SLOT affects the request only. BOOKED requires a recorded operator confirmation. Payment never confirms availability.
- Operator directory, Tour Library with agent prices, source document/page/version, validity and verification status. No fabricated catalogue or availability.
- Private PDF/image/CSV/XLSX uploads into R2; authenticated downloads.
- Cash / Online payment recording, refunds, independent paid/outstanding totals, expenses, monthly review and actual XLSX export.
- Durable D1 records, append-only audit events, optimistic concurrency checks and transaction guards for confirmations/refunds.
- Portable JSON record + event backup. Uploaded file binaries must be downloaded/backed up separately.
- Responsive blue/Saira interface, context panel, copy context for use alongside ChatGPT.

## Deliberately pending

- Android POS import mapping and reconciliation: requires a real anonymized CSV/XLSX export. Upload it to Documents first. The upload does not import financial transactions.
- Real WhatsApp delivery and coexistence verification: pending secrets + Meta webhook subscription. The new backend/UI is implemented; see the current setup guide.
- Embedded AI/API billing, automated PDF extraction and live operator availability: not enabled.
- JSON backup restoration UI: not implemented. Admin-created staff accounts share operational access; only admin can create accounts. See docs/ACCOUNTS.md.
- Native private Site archiving runs when the workspace is accessed/refreshed (the client refreshes every minute while open). There is no background task on the private Site yet. The exported Worker implements scheduled archiving; the example deployment enables a five-minute cron when deployed to your own account. Threshold is 48 hours, execution can be up to one cron interval later.

## Stack and storage choice

React / Vinext, TypeScript, Cloudflare Workers, D1 and R2. The older starter proposed Supabase; this implementation uses server-backed D1/R2 to run in the private Site now and remain deployable to Cloudflare. Business records are not stored in browser localStorage. Initial production data is empty; QA uses local storage only.

## Development

Node >=22.13.0 and pnpm 11.25.0. Install with `corepack pnpm install --frozen-lockfile`, or the included installation helpers where the runtime provides them. Use `pnpm dev`.

Apply the SQL migration to the local D1 database before testing. In the Sites environment, build first, then use:

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_nice_moira_mactaggert.sql
```

The local-only development identity is restricted to dev builds on localhost / terminal.local. It does not exist in production. Never enable a development server as a public CRM.

## Checks

```
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Tests cover archive exclusions and boundary timing, owner scope, stale writes, atomic request/booking confirmation, concurrent refund balance guards, formula-safe text and XLSX package creation. The ledger export was also read using openpyxl. Browser QA covers creating/saving an inquiry and converting it to a booking with a server refresh.

## Deployment

Read [Vietnamese setup guide](docs/SETUP-SUBDOMAIN.vi.md) and [security notes](docs/SECURITY.md). This ZIP contains source code. It cannot be deployed by dropping only index.html into the existing public Worker.

`docs/legacy-starter/` preserves the prior localStorage prototype for reference only. It is not the served application. Do not deploy that old index.html.

Production domain: ws.thehub.express
