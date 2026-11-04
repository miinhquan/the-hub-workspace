# THE HUB WORKSPACE — PROJECT HANDOVER

**Handover version:** 1.0  
**Prepared:** 2 November 2026  
**Product:** The Hub Workspace / Private Business Console  
**Business:** The Hub Hanoi, Vietnam  
**Status:** Product direction and specification substantially agreed; starter prototype exists; production implementation has NOT started.

---

## 0. Instructions for the next ChatGPT Work session

You are taking over an ongoing product build. Treat this handover and the attached `the-hub-workspace-v1.zip` as the canonical starting context. Do not restart discovery or ask the owner to repeat decisions already recorded here.

The owner wants a **real, working private CRM/workspace**, not another mockup or a conceptual proposal. Inspect the supplied starter source and specification first, identify what is genuinely implemented, then continue implementation in small verified increments. Be explicit about what works, what is only specified, and what still depends on credentials, external platform approval, or real sample data.

Before making production-impacting changes, explain the impact and obtain approval where credentials, billing, account migration, live messaging, destructive database changes, or public deployment are involved. Do not expose secrets in frontend code or ask the owner to paste passwords, OTPs, access tokens, or QR login credentials into chat.

### First actions
1. Inspect `README.md`, `docs/SPECIFICATION.md`, `database/schema.sql`, and `index.html` in the supplied starter ZIP.
2. Run the local starter and assess its actual behavior. Do not assume the specification is already implemented in the UI.
3. Create/maintain one canonical implementation repository and a clear change log. If a GitHub connector is available and the owner connects it, use it; otherwise keep an exportable source bundle.
4. Implement the operational data model and working UI before attempting messaging integrations.
5. Ask for the Android POS export sample at the point the POS importer is being implemented. This file is still missing.
6. Verify current WhatsApp Business Platform / Coexistence requirements from official Meta sources before recommending or attempting a change to the owner's existing WhatsApp number.

---

## 1. Product vision

The Hub Workspace is a compact, private operating console for The Hub Hanoi. It should help the owner run day-to-day operations across:

- Self-service laundry / laundromat.
- Northern Vietnam tours and travel bookings.
- Bus and train tickets.
- SIM / eSIM sales.
- Other add-on services where applicable.
- Customer enquiries, supplier coordination, booking records, POS transaction imports, and finance preparation.

This is **not** intended to be an enterprise CRM or a KPI-heavy dashboard. Prioritize fast data entry, clear status, traceable history, simple search, and dependable records.

The owner wants a practical workspace used during live shop operations. Avoid overbuilding analytics and avoid creating extra manual steps unless they protect data integrity.

### Brand and interface direction
- Product name: **The Hub Workspace**.
- Brand color: `#0546ac`.
- Typeface: Saira (Regular / Medium / Bold / ExtraBold where appropriate).
- Visual direction: modern, clean, compact SaaS interface; professional but youthful.
- Desktop-first, responsive for smaller screens.
- The AI assistant concept is a right-side sidebar, but the preferred implementation is to use the **native ChatGPT Side Chat / ChatGPT Work experience alongside the CRM**, rather than paying to build a separate AI chat interface immediately.
- UI labels may be in English; operational explanations and owner-facing guidance can be Vietnamese. Customer and tour content must support English.

---

## 2. Decisions already confirmed by the owner

### Messaging and channels
- **WhatsApp:** The Hub uses **WhatsApp Business App** (not ordinary personal WhatsApp). The owner's desired CRM behavior is only:
  1. receive a new-message notification in The Hub Workspace;
  2. click it and open the relevant WhatsApp conversation/tab;
  3. continue chatting in WhatsApp itself.
  The owner does **not** want a WhatsApp chat client embedded in the CRM.
- **WhatsApp integration direction:** investigate WhatsApp Business Platform / Cloud API Coexistence as the preferred official route, subject to current country/account eligibility and onboarding requirements. Do not promise eligibility. A browser-extension approach may be considered as a fallback prototype, but it is less reliable and must be assessed against platform rules. Do not migrate the number or change the live WhatsApp setup without explicit approval.
- **Zalo:** The owner currently uses a **personal Zalo account** primarily to contact tour operators, ask availability, and communicate in groups with suppliers. Zalo is not currently intended as a customer-service inbox for the CRM.
- Do **not** require the owner to buy Zalo OA for the current use case. OA and personal Zalo are different products. Do not treat the earlier OA discussion as an approved purchase or implementation decision.
- Replace the idea of a standalone Zalo inbox/menu with **Tour Library** and **Operators**. Store the operator's Zalo contact/group details inside the operator profile where useful. Open Zalo externally; no official personal-account webhook is assumed.

### Tour documents and AI
- The owner wants a searchable **Tour Library**, not a generic file browser.
- The library should connect tour/product records, operator records, source PDFs, itineraries, price lists, policies, and source page/version references.
- The owner wants ChatGPT to help read tour operator PDFs and help process bookings.
- Preferred AI approach: use native ChatGPT Plus / ChatGPT Work / Side Chat alongside the CRM if possible. Do not claim a Plus subscription can be embedded as an authenticated AI session inside a separately built website. A website AI powered by OpenAI API would be separate and separately metered; do not build that by default in V1.
- Important integration limitation: merely opening the CRM and ChatGPT side-by-side does not guarantee that ChatGPT can inspect the CRM's private database or all stored PDFs. Work must test what the active browser/Work environment can actually read. Provide a deliberate context handoff (selected booking summary, operator/tour record, attached/source document, or export) when required. A later connected file source or secure retrieval endpoint can be considered.

### POS and finance
- POS: Android POS terminal. Exact device/vendor/model and export format are not yet known.
- The owner intends to export POS transaction data and import it into the CRM to consolidate monthly records and support bookkeeping/reconciliation.
- Do not assume the POS file schema. Request an anonymized export sample before implementing exact column mapping.
- The owner also writes a separate customer-facing invoice/receipt outside the CRM and uses it for external reconciliation. CRM should **record** the Hub invoice number/reference and the financial facts; it should not replace the existing paper/external invoice process or claim to be statutory accounting/tax software.

### Privacy and hosting
- The owner wants the CRM private and not part of the public-facing website navigation.
- Use a private subdomain under a domain the owner confirms is owned/controlled. Previous candidate domains and Cloudflare/Mắt Bão discussions are historical context only; do not assume a particular domain is purchased, active, or correctly configured.
- A secret URL or hidden button is not security. Require real authentication and server-side authorization. Recommended: Supabase Auth, MFA, RLS, optionally Cloudflare Access as another layer.

---

## 3. Proposed navigation and product modules

Recommended main navigation:

1. **Overview** — compact operational snapshot, pending work, recently updated records.
2. **Inbox** — customer contacts and external conversation links; WhatsApp notification integration later if supported.
3. **Customers** — searchable customer directory and contact history.
4. **Inquiries** — potential customer demand, quotations, follow-ups, and inactive enquiries.
5. **Bookings / Booking Log** — actual booking requests and confirmed bookings.
6. **Tour Library** — searchable tour catalogue, operator price data, itineraries, and source files.
7. **Operators** — tour operator directory and their contacts / Zalo group references.
8. **Finance** — payment records, Hub invoice references, monthly operational ledger, reconciliation preparation.
9. **POS Import** — upload and map Android POS exports.
10. **Documents** — general business documents not specific to a tour.
11. **Settings** — account, integrations, import mappings, inactivity rules, backups.

The starter UI currently has only Overview, Inbox, Bookings, Customers, Finance, POS Import, Settings, and an AI Copilot shell. The new modules above are product requirements, **not yet implemented in that starter UI**.

---

## 4. Inquiry model — agreed workflow and 48-hour Auto-Archive

### Inquiry is not a Booking
- An **Inquiry** is a genuine customer request worth tracking (e.g. asks for a Ha Long Bay price or asks about dates).
- A generic inbound message or merely opening a chat should not automatically create an Inquiry. AI may suggest that a message is a tour enquiry; the owner confirms creation.
- One customer can have multiple Inquiries over time.
- An Inquiry may be converted into a Booking when the customer is ready to place an order / asks The Hub to proceed with a reservation.
- Once converted to a Booking, the Inquiry timer stops. Preserve the link between them.

### Suggested Inquiry statuses
`New` → `Quoted` → `Following Up` / `Waiting Customer` → `Ready to Book` → `Converted`.

Other terminal/administrative states: `Lost`, `Cancelled`, `Archived`.
`Waiting Operator` should be used only where an operator check is genuinely in progress; see the protection rule below.

### Auto-Archive policy — confirmed
- Threshold: **48 consecutive hours without meaningful activity**.
- This is a **soft archive**, not a deletion. Never physically delete the inquiry or its Activity Log because of inactivity.
- The inquiry disappears from the active Inquiry list and appears in Archived.
- Store `archived_at`, `archive_reason = inactivity_timeout`, and the status immediately before archival.
- Write an `auto_archived` Activity Log event with timestamp, system actor, reason, threshold, and last activity time.
- **Restore must be available** for an auto-archived Inquiry.
- Restore returns the Inquiry to the status it had immediately before auto-archive, clears the active archive marker, sets `last_activity_at` to the restore time (restarting the 48-hour timer), and writes a `restored` event. Keep the earlier `auto_archived` event; do not overwrite history.

### What counts as meaningful activity and resets the timer
- Customer message received (only if the event is actually available/recorded).
- Owner reply sent or manually recorded.
- Quotation sent/recorded.
- Operator reply recorded.
- Meaningful edit to the Inquiry details or status.
- Substantive note or follow-up recorded.

### What does NOT reset the timer
- Opening/viewing a record.
- A background notification without a corresponding message event.
- Background sync.
- Automated reminder by itself.
- Auto-archive itself.

### Do not auto-archive these
- Any Booking. In particular, never auto-archive a Booking waiting for operator confirmation or a `BOOKED` Booking.
- Any Inquiry linked to an active/pending operator request.
- Any Inquiry linked to a successful operator booking.
- Once converted into Booking, stop the Inquiry timer.

If the owner restores an Inquiry, the 48-hour timer starts again from the restore timestamp.

---

## 5. Booking Log — customer request vs operator request

The owner wants the Booking Log to represent real booking work, not every casual price question.

### Core relationship
- **Customer Booking**: the customer's intended purchase/booking. This holds the customer, selected service/tour, travel date, passenger count, selling price, and payment/invoice records.
- **Operator Request**: each request sent to an individual tour operator to check availability or place the reservation. A single Customer Booking may have multiple Operator Requests (e.g. first operator has no slot; The Hub tries another operator).

This separation is essential: a `NO SLOT` response from one operator must not destroy or cancel the customer's overall request.

### Core action buttons on an operator request
Use the three explicit outcomes agreed with the owner:
- **BOOKED** — the operator confirms that the reservation is successfully made/held. Only this means the operator booking is confirmed. Capture operator confirmation/reference and evidence if available.
- **NO SLOT** — that operator cannot serve the requested date/product or has no availability. Close only that Operator Request. Keep the Customer Booking open so another operator can be tried.
- **CANCELLED** — the customer no longer wants to proceed / the customer-side request is cancelled. Archive/close the customer booking according to the final product workflow, preserving history.

Do not equate these events:
- available slot ≠ booked;
- customer says “yes” ≠ operator booking confirmed;
- payment ≠ operator confirmation;
- operator `NO SLOT` ≠ customer cancellation.

### Booking and payment status are separate
A confirmed booking can still be unpaid. Payment status should independently support at least:
`Unpaid`, `Deposit Paid`, `Partially Paid`, `Fully Paid`, `Refund Pending`, `Refunded`.

Booking lifecycle should support at least:
`Pending Operator` / `Requested`, `Booked`, `Completed`, `Cancelled` (with clear state mapping and timestamps).

### Financial and invoice details to record
- Selling price charged to customer.
- Operator cost / actual cost.
- Currency.
- Payment amount(s), dates, methods, transaction references.
- Outstanding balance.
- The Hub's external invoice/receipt number (`hub_invoice_no`) and optionally issue date.
- Operator confirmation/reference and attachment (e.g. screenshot, voucher, confirmation PDF).
- Margin may be calculated from verified selling price and cost; label it as expected/actual as appropriate.

The CRM is an operational record and reconciliation aid. The owner continues to issue the customer invoice/receipt outside this app. Do not create a statutory invoice engine unless requested later.

### Activity Timeline
Every Inquiry, Booking, and Operator Request should keep an auditable timeline. Example events:
- Inquiry created from WhatsApp / website / walk-in.
- Tour selected.
- Source price checked (with source document/page/version).
- Operator request sent (manually recorded unless an official integration exists).
- Operator replied / `NO SLOT` / `BOOKED`.
- Quotation sent to customer.
- Payment recorded.
- Hub invoice reference recorded.
- Inquiry auto-archived / restored.
- Booking completed / customer cancelled.

For personal Zalo, assume the owner records the operator response manually or attaches screenshot/evidence. Do not pretend the app can automatically read Zalo personal group messages.

---

## 6. Tour Library and Operators

Tour Library replaces the earlier concept of a standalone Zalo menu. It should be structured around products and their source documents, not simply a list of PDF filenames.

### Tour Library
Search/filter by:
- Destination (Ha Long Bay, Ninh Binh, Ha Giang, Sapa, Mai Chau, Hanoi, etc.).
- Tour name / itinerary / activity.
- Duration (day tour, 2D1N, etc.).
- Operator.
- Tour type, departure point, included/excluded services, season/date validity where documented.

Each tour product should link to:
- One or more operators who supply it.
- Agent/net price and currency, with price validity/effective dates where present.
- Customer-facing description and itinerary.
- Inclusions, exclusions, pickup/departure details, policies, child pricing, cancellation rules, and other fields only when supported by source material.
- Source document(s), page/section, uploaded date, version, and extraction/verification status.

**Pricing rule:** the default price used for The Hub's internal tour sales is the **agent price** from the operator's source material. Do not repeatedly ask the owner to confirm whether to use agent price; it is the default. Never invent a price. If sources conflict or are expired/unclear, show the conflict and request verification.

**Availability rule:** never infer live availability from a price list or PDF. The operator must confirm the requested date/slot.

### Operators
Each operator record should hold:
- Name and trading identity.
- Main contact name(s), phone, email, website if available.
- Personal Zalo contact/group details and external link/reference if the link is usable.
- Services/destinations offered.
- Linked Tour Library products.
- Notes, usual response method, operating hours (only if known), and documents.

The owner's Zalo group chats remain external. CRM stores the relationship and can provide an `Open Zalo` action if a valid link/deep link is available; do not promise that a link will always open a specific group on every device until tested.

---

## 7. Inbox and messaging behavior

### WhatsApp
Desired behavior is notification + jump to chat, not in-CRM chatting:
1. Receive a verified inbound-message event.
2. Show customer / sender, channel, preview, and received time in CRM Inbox.
3. Clicking the notification opens the corresponding WhatsApp conversation/tab.
4. Owner replies in WhatsApp itself.

Investigate official WhatsApp Business Platform / Cloud API Coexistence because the current number is in WhatsApp Business App. Confirm current eligibility, supported market, onboarding path, webhooks, billing, and whether click-through to a specific conversation can be implemented. If the official API does not provide a direct conversation deep link, clearly explain the fallback (open WhatsApp Web/Business app or contact thread list) rather than claim exact routing.

Do not implement a WhatsApp web clone or iframe. Do not store the owner's WhatsApp session cookies. Do not use unofficial automation as a production dependency without explicit review and approval.

### Zalo
- Personal Zalo only for supplier/operator contact at present.
- No automatic Zalo message notifications are required for current scope.
- No Zalo OA purchase is approved.
- No personal Zalo webhook/API should be assumed.
- A Chrome extension / DOM observer may be researched only as an optional experiment, with stability and platform-terms caveats. Not a V1 dependency.

---

## 8. POS Import and Finance

### Known facts
- The POS is an Android terminal.
- Exact POS brand/model/app and exported columns are unknown.
- A real, anonymized CSV/XLSX export sample has not yet been provided.

### Required workflow
1. Upload a POS export.
2. Preview the file and detect likely columns.
3. Allow explicit column mapping and review before import.
4. Normalize transactions into a canonical schema.
5. Preserve the original file, original rows, import batch, and mapping used.
6. Detect exact duplicates where stable IDs exist; where no ID exists, conservatively flag possible duplicates rather than silently discarding them.
7. Report imported, skipped, duplicate-suspect, and failed rows.
8. Support monthly filters, category/payment-method breakdowns, refunds, fees, and CSV/XLSX export as the real POS schema allows.

Canonical transaction fields should include:
`source_file_id`, `source_row_number`, `external_transaction_id`, `occurred_at`, `description`, `item_name`, `category`, `gross_amount`, `discount_amount`, `refund_amount`, `net_amount`, `currency`, `payment_method`, `transaction_type`, `cashier_or_terminal`, `raw_payload`, `import_batch_id`.

The initial starter currently accepts **CSV only** with basic column-name detection. It is not yet a robust XLSX importer or reconciler. Do not report accounting totals as final until mapping and reconciliation rules have been validated against real export files.

Finance should eventually reconcile POS transactions against:
- cash;
- QR / bank transfer;
- card;
- online payment gateway;
- refunds;
- gateway/settlement fees;
- operator costs/direct costs;
- Hub invoice references.

Clearly separate gross sales, discounts, refunds, fees, net receipts, direct costs, and gross margin. Do not infer tax/accounting classification from ambiguous source data.

---

## 9. AI and document access

### Preferred first implementation
Use native ChatGPT Plus / ChatGPT Work / Side Chat outside or alongside the CRM, with a curated Tour Library and selected booking context. This avoids an immediate, separate OpenAI API spend.

Design the CRM so an owner can deliberately give ChatGPT the context it needs, for example:
- `Copy booking summary` action with customer, tour, date, passenger count, operator, and status (avoid exposing unnecessary personal details).
- `Open source document` or download selected operator PDF.
- Export/share a selected tour record and its source references.
- A clear way to attach the correct operator's PDF to a Work task or Project.

Do not assume that ChatGPT Side Chat automatically sees every private database row or all PDFs in the CRM. Validate the actual browser/Work capabilities in the user's environment. Do not represent the ChatGPT Plus account or chat history as embedded inside the website.

### Later optional API copilot
If the owner later requests an in-CRM AI assistant, build a separate server-side API integration with:
- scoped read-only tools first;
- strict authorization and row-level access;
- explicit owner confirmation before writes, sending messages, booking confirmations, payment changes, or financial edits;
- audit log of AI-suggested and owner-approved actions;
- API keys held only on the server.

---

## 10. Technology and deployment recommendation

Recommended stack:
- Frontend: Next.js App Router + TypeScript + Tailwind CSS.
- Data/backend: Supabase Postgres, Auth, Storage, Row Level Security.
- Scheduled task: Supabase Cron or a protected scheduled Edge Function for the 48-hour Inquiry soft-archive job.
- Hosting: Cloudflare Pages/Workers or Vercel; choose after checking domain and operational requirements.
- Private subdomain: something like `workspace.<confirmed-owned-domain>`; do not hard-code a guessed domain.

Production security requirements:
- Real sign-in (owner-only initially), ideally MFA.
- Server-side authorization on every mutation.
- RLS enabled and properly scoped on every user/business table.
- No secret route as the only security measure.
- No `noindex`/hidden route presented as access control.
- No API keys or service-role keys in browser JavaScript.
- Do not rely on localStorage for production customer/booking/finance data.
- Backups, audit trail, safe import logs, and recoverable error states.
- Review the starter SQL RLS policies before production: they are **starter examples** and are not an approved production security model.

Domain/DNS: The owner has previously discussed Mắt Bão and Cloudflare, but current registrar, domain ownership, nameservers, and active domain must be verified before deployment.

---

## 11. Current starter source — honest implementation status

Attached archive: `the-hub-workspace-v1.zip`.

Files inside:
- `index.html` — local single-page HTML/CSS/JS starter.
- `README.md` — run instructions and limitations.
- `docs/SPECIFICATION.md` — product/technical spec version 0.2.
- `database/schema.sql` — starter Supabase schema/functions/RLS examples.

### What the current local prototype actually does
- Overview with sample/empty operational counts.
- Customer directory and search.
- Manually-created booking rows and simple status tracking.
- Inbox/contact hub that opens stored external chat links.
- CSV upload, preview, basic column recognition, and local transaction import.
- Monthly gross/refund/net view and CSV export.
- JSON browser-local backup/restore.
- Persistent right-hand AI Copilot visual shell; it does not call an AI model.
- Local browser storage (`localStorage`).

### What is NOT implemented in the current UI
- No production login/authentication.
- No cloud database or multi-device synchronization.
- No production deployment or private domain.
- No actual WhatsApp webhook or Coexistence integration.
- No Zalo personal integration (and none is currently required).
- No Tour Library UI/catalogue or operator directory.
- No separate Inquiry UI/creation flow.
- No scheduled 48-hour Auto-Archive execution.
- No Restore UI action (the SQL specification/function is a starting point, not a finished product feature).
- No fully linked Customer Booking + multiple Operator Requests workflow.
- No payment ledger or Hub invoice reference workflow in the current prototype.
- No live AI integration.
- No robust XLSX parser or verified POS adapter.
- No full reconciliation / statutory accounting features.

### SQL status
`database/schema.sql` contains starter table/function logic for inquiries, operator requests, activity history, auto-archive, and restore. It also contains example authenticated-user policies that require production security review and tightening. The SQL function is not proof that the scheduled job is deployed or running. A protected scheduler still needs to invoke the archive function at an appropriate interval, and tests must verify exclusions/restoration behavior.

**Version naming:** The product specification is version 0.2; the UI starter is still version 0.1. Do not call the current prototype a production v0.2 application.

---

## 12. Recommended implementation roadmap

### Phase 0 — repository and product foundation
- Inspect and run the current local starter.
- Create canonical app structure and component system using the existing visual direction.
- Confirm target domain and hosting only when the owner is ready.
- Create database migrations and proper RLS model.

### Phase 1 — core data model and usable CRM
Implement persistent CRUD for:
- Customers;
- Inquiries;
- Inquiry Activity Log;
- Bookings / Customer Bookings;
- Operator Requests;
- Operators;
- Tour products and source documents;
- payments and external Hub invoice references;
- POS import batches and normalized transactions.

### Phase 2 — Inquiry and Booking workflow
- Create Inquiry from Inbox/customer record.
- Convert Inquiry to Booking.
- Maintain multiple Operator Requests per Booking.
- Provide `BOOKED`, `NO SLOT`, `CANCELLED` actions with the scope described above.
- Create a complete Activity Timeline.
- Implement 48-hour soft archive with protected scheduler, Restore, and automated tests.
- Do not hard-delete archived records.

### Phase 3 — Tour Library
- Upload and organize operator PDFs.
- Extract text and, when needed, inspect original page images/tables.
- Build structured tour/operator records with citations to source file and page.
- Implement search and filters.
- Store agent price as default internal price, with validity and source provenance.
- Never infer availability.

### Phase 4 — POS and Finance
- Obtain anonymized Android POS export.
- Build a tested file adapter and mapping interface.
- Reconcile imported transactions and avoid silent deduplication.
- Add Hub invoice reference and payment recording.
- Validate with owner-provided sample totals.

### Phase 5 — Messaging integration
- Verify current WhatsApp Business App / Coexistence eligibility from official sources and actual account state.
- Present the migration/connection impact before any account changes.
- Implement webhook notification and click-through behavior only after a successful test.
- Keep Zalo personal external and manual for now; operator records can hold Zalo links/group information.

### Phase 6 — ChatGPT Work workflow and deployment
- Test ChatGPT Work access to CRM page/context and Tour Library files.
- Implement copy/export/context handoff so the user can ask ChatGPT about a selected booking and source files.
- Deploy to a verified private subdomain with MFA, RLS, backups, and error monitoring.
- Perform security and acceptance testing before using real customer/payment data.

---

## 13. Acceptance criteria for a real V1

A first production release should not be considered complete until:

1. Owner can securely sign in and only access The Hub workspace.
2. Customers, Inquiries, Bookings, Operator Requests, and Activity Logs persist across browsers/devices.
3. Inbox stores customer contact/channel and opens external WhatsApp/Zalo conversations where a valid link exists.
4. An Inquiry can be created intentionally, quoted, followed up, converted, archived, and restored.
5. The 48-hour inactivity job soft-archives only eligible Inquiries, writes an Activity Log event, and never deletes records.
6. Restore returns the prior status, writes a restore event, and resets the inactivity clock.
7. Booking/active operator request records are protected from Inquiry Auto-Archive.
8. A `NO SLOT` outcome closes only the matching Operator Request; the customer request remains available for another operator.
9. `BOOKED` can only be recorded after operator confirmation; customer acceptance and availability are not enough.
10. Tour search results show the source operator/document/page and never fabricate prices or availability.
11. POS imports can be mapped, previewed, audited, and reconciled using a real anonymized POS export sample.
12. Hub invoice reference and payments can be recorded without replacing the owner's external invoice process.
13. Backups/exports work and sensitive data is not stored only in browser localStorage.
14. WhatsApp notifications are only marked as integrated after real inbound test events and click-through behavior have been verified.

---

## 14. Outstanding inputs (do not block all development)

The following are not yet known and can be requested when the related phase begins:

1. **POS sample:** anonymized CSV/XLSX from the Android terminal; also device brand/model and app name if known.
2. **Domain:** confirm the domain currently owned and DNS/Cloudflare access route before deployment.
3. **WhatsApp:** verify the current WhatsApp Business App number, account/business setup, and whether Meta Coexistence is offered for it; do not request the number or credentials in an unsecured chat.
4. **Tour source files:** gather the current operator PDF price lists, itineraries, policies, and versions for Tour Library ingestion.
5. **Operator contacts:** operator names and the preferred Zalo group/contact reference for each.
6. **Invoice workflow:** sample/format of the Hub's external invoice/receipt and the minimum fields needed for reconciliation.

The owner has already decided the broad product workflow. Do not ask again whether they want a ChatGPT side panel, Zalo personal vs OA for current supplier conversations, or chat embedded inside the CRM; those decisions are recorded above.

---

## 15. Suggested opening message for the Work session

Paste the following message together with this handover and the starter ZIP:

> Continue The Hub Workspace from the attached Project Handover and starter source. First inspect the actual files and run the existing prototype. Keep all confirmed decisions in the handover; do not restart discovery. I want a real, working private CRM, not just another mockup. Start by reconciling the existing UI, specification, and SQL, then propose the smallest concrete implementation milestone and begin building it. Clearly distinguish implemented, specified, and blocked items. Do not deploy publicly, connect/migrate live WhatsApp, spend money, or alter production accounts without my explicit approval. The most important product areas are Tour Library + Operators, Inquiry/Booking workflow, 48-hour Inquiry Auto-Archive + Restore, and later the Android POS import. Use ChatGPT Work/Side Chat as the preferred AI workflow rather than building a separate paid AI chat API by default.

---

**End of handover.**
