# The Hub Workspace — Starter Build v0.1

## Project handover
Before continuing development in ChatGPT Work, read `docs/PROJECT_HANDOVER.md`. It records the confirmed product decisions, current implementation status, constraints, and next milestones.

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser (Chrome/Edge recommended).
3. Records are saved in this browser's localStorage.

## Included working features
- Overview and monthly sales snapshot
- Customer directory with search and saved external chat links
- Booking creation and status tracking
- Inbox/contact hub that opens external chat links
- CSV POS import with preview and basic column detection
- Monthly transaction ledger and CSV export
- JSON workspace backup/restore
- Persistent right-side AI Copilot UI shell

## Important limitations
This is a functional local-first starter, not yet a secure hosted production CRM. It has no user authentication, cloud database, multi-device sync, automatic Zalo notifications, WhatsApp API integration, or live AI connection. Do not enter sensitive customer or payment information. `database/schema.sql` is a starting point for the future Supabase backend, not a complete production security policy. Review `docs/SPECIFICATION.md` before deployment.

## Next required input
Provide one anonymized export from the Android POS terminal. The exact POS export schema is needed before promising correct import, reconciliation or accounting totals.

## Specification update v0.2 — Inquiry lifecycle
The product specification and starter SQL schema now include:
- 48-hour inactivity-based soft archive for active Inquiries only.
- Restore for auto-archived inquiries, preserving the previous status and all activity history.
- Restore creates an Activity Log event and restarts the 48-hour inactivity timer.
- Bookings waiting for operator confirmation and booked bookings are excluded from auto-archive; converting an Inquiry to a Booking stops the Inquiry timer.
- `NO SLOT` applies to one operator request, not the customer's overall request.

**Implementation status:** These lifecycle rules are now specified and represented in the database starter schema. The current `index.html` local starter UI does not yet implement Inquiry creation, scheduled auto-archive, or Restore. A production scheduler (Supabase Cron or a scheduled Edge Function), UI actions, and tests are still required. The supplied RLS policies are starter examples and require production security review before deployment.
