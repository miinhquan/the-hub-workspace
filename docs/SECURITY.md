# Password-account revision

See [ACCOUNTS.md](ACCOUNTS.md) for the current authentication model. The older identity paragraphs below describe the previous release and are superseded. All business APIs now use server-side Workspace sessions.

# Access and operational boundaries

- Native Site: owner-private audience and Sites-injected authenticated identity, with owner-only membership enforced by the platform access policy. Do not expand sharing without implementing proper staff authorization.
- External Cloudflare Worker: verifies Cloudflare Access RS256 signature using the fixed team certificate endpoint, issuer, audience, expiry, not-before and OWNER_EMAIL. No trust in supplied Sites identity headers on external hostnames. Missing external authentication configuration fails closed.
- Every data/file API authenticates server-side and scopes records to the workspace owner. R2 file keys must match the authenticated owner prefix. Mutation endpoints require matching same-origin Origin headers.
- Business records reside in D1. Files reside in a private R2 bucket. The client receives records only after authenticated API access. Never make the bucket public.
- No hard-delete endpoint; archive preserves history. Payment entries are immutable through normal editing; corrections use refunds. Audit logs are append-only through the API, but database administrators can still change storage; this is not a tamper-proof accounting ledger.
- Multiple-record confirmation and payment/refund writes are transactional. Per-record version guards reject stale edits. Amounts use JavaScript/SQLite numeric values; this release is an operational ledger, not a tax/general accounting system. Use VND and USD only; currency cannot change after payments exist.
- Backups contain customer information. Store exports privately. JSON export contains metadata and records, not uploaded binaries; download documents separately. Restore/migration requires an explicit operator-run process.
- Outgoing conversation links open external apps. This application does not send messages, claim live slots, collect card details, or connect to a paid AI API.
- On the native Site, soft archiving is lazy (access/refresh). Own Worker deployment can use the included five-minute scheduled trigger. Bookings are never auto-archived.
