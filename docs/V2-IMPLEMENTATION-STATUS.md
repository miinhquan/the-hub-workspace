# Control Center revision · 3 November 2026

The v2 text brief supplied in this conversation supersedes the older prototype. This revision implements the operational desk milestone. It is NOT a claim that all 25 sections of the full specification are complete.

## Implemented and testable now

- Four main work tiles: WhatsApp notifications, pending tasks, quick manual sale entry, tour search. No left navigation; secondary screens available through a compact More control in the header; record details open as a slide-over, no fake embedded AI chat.
- Queue tabs for operator requests, active inquiries, outstanding customer collections and departures. Direct record access.
- Manual walk-in sales write durable records and audit events independently of bookings and POS, with a per-submit idempotency key. Cash/Online selection required before recording. Manual sales appear in the existing Finance ledger/export.
- Separate Expenses and searchable Activity Log navigation.
- Name-only basic inquiry entry; passenger count optional; no default invented travel date.
- Copy Vietnamese operator request (no agent-price check sentence). Copy expanded source/operator/price context for ChatGPT.
- Operator confirmation stores selected supplier, request ID and confirmation timestamp; a second selected supplier is rejected. UI/API payment action requires Booked/Completed, with refunds retained. Cancellation of a paid booking flags refund review.
- Prepared WhatsApp webhook: verification challenge; HMAC-SHA256 signature check; approved phone-number-ID filter; deduplicated incoming-message notification records; identity, time and preview; mark read; WhatsApp Web phone shortcut. No messages are sent.
- Incoming messages may reset an active inquiry clock only when an explicit phone contact identifier matches. Archived matches stay linked for manual Restore. Viewing/marking a notification read does not reset inquiry activity.
- Inbox refreshes every 15 seconds while open. Optional browser notification permission button. Alerts are generic (message preview not included on lock screen). No Web Push or service worker; closed tabs cannot notify.

## External approval / account work required

- Coexistence eligibility for The Hub's actual WhatsApp Business App number is UNVERIFIED. Having the app does not automatically grant Cloud API access.
- Do not register/migrate/disconnect the number, accept subscriptions, alter linked devices or enable billed messaging without approval.
- Secrets required only server-side: WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN, WHATSAPP_PHONE_NUMBER_ID. No send-message access token is needed for this receive-only handler.
- Endpoint: /api/webhooks/whatsapp. Meta must reach a public ingress for this exact signed endpoint. The owner-private native Site currently gates all external requests, so it cannot receive Meta webhooks directly. On external Cloudflare hosting, configure a narrowly scoped ingress/Access exception only for this path after approval, or use a separately protected webhook gateway. Never expose the rest of the CRM. The signature check must remain enabled.
- Coexistence must actually be onboarded and subscribed to incoming `messages` events. App echo/history sync and linking old contacts are not implemented. Account setup and end-to-end delivery must be tested before claiming live notifications.
- WhatsApp Web phone links may open a chat or ask the user to open/search WhatsApp. Exact existing-conversation navigation is not guaranteed by WhatsApp.
- Meta's direct Coexistence documentation returned HTTP 429 during research. Exact regional eligibility, linked-device implications and provider pricing remain to be checked through the actual account/onboarding route. Official platform pricing: https://business.whatsapp.com/products/platform-pricing . Coexistence documentation: https://developers.facebook.com/docs/whatsapp/embedded-signup/custom-flows/onboarding-business-app-users/ . Vendor documentation reference: https://docs.360dialog.com/docs/resources/phone-numbers/coexistence . No vendor selected or subscription purchased.

## Partial / not implemented yet

- Reliable background 48h archive: scheduled handler is in code and deployment example has a cron; the existing native private Site still archives on access only. It is not yet compliant with the background-job requirement. Requires approved production scheduler configuration and closed-browser verification.
- Finance remains a basic operational ledger with a single-sheet export. Full multi-sheet reports, profit by service, operator payable reconciliation and tax/accounting reports are not complete. Never label cash receipts as profit.
- Android POS file parsing/consolidation awaits an actual sample. It is independent of Records/Expenses; no automatic mapping or synchronization will be added. Combined monthly reports must preserve POS as a separate source and detect overlap instead of double-counting.
- Tour side-by-side comparison, searchable extracted PDF text, full document versions/categories/linking, multiple booking items, bulk historical message linking, website automatic inquiry intake, full backup restore UI and relational schema expansion remain pending. Current storage uses scoped typed JSON records with server relationship checks, not the fully normalized model proposed in v2.
- Audit events exist; structured before/after values are not yet complete for every action. Refund statuses need richer workflow than the present paid/outstanding summary.
- Browser-extension notification bridge is not built or installed. It remains an optional fallback if official onboarding is unsuitable.

## Verification

- TypeScript checks and production build.
- Core SQLite transaction tests: archive guards, stale writes, atomic operator confirmation, refund balance and owner scoping.
- WhatsApp unit tests: correct signature, wrong key, tampered body, missing signature, approved-number isolation, incoming text parsing.
- Local browser QA: control center renders; Cash/Online gates quick entry; manual 50,000 VND test sale reaches Finance and audit record. Test data is local only, clearly labelled, not a real payment.
- No real WhatsApp webhook delivery, Meta onboarding, device changes, billing, DNS changes or production database writes performed in this revision.

## Release boundary

The user approved updating the owner-private Site on 3 November 2026 and requested removal of left navigation. Publish this revision with the existing owner-private audience. WhatsApp onboarding, DNS/account/billing changes and external infrastructure still require separate approval.
