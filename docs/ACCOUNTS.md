# Workspace accounts · 4 November 2026

This revision replaces reliance on ChatGPT visitor headers / Cloudflare Access JWTs with the requested application login. The public page contains only the login screen. Customer records, file uploads/downloads, export and all Workspace actions require a server-validated session.

- Initial admin login: `admin`. Its initial password is supplied by the owner and is NOT tracked in source or migrations.
- `INITIAL_ADMIN_HASH` is configured as a secret runtime variable. It is a salted PBKDF2-SHA256 verifier (100,000 iterations for Workers WebCrypto compatibility), used only by insert-if-absent bootstrap. Existing admin password hashes are never overwritten by bootstrap.
- Sessions: random 256-bit token, only SHA-256 digest stored in D1; seven-day absolute expiry; HttpOnly, SameSite=Lax, Secure on HTTPS, host-only cookies.
- Login attempts: 10 per login identifier per 15-minute window, server-side D1 counter. No browser-only rate limit.
- There is no signup endpoint/button and no verification email. Only a current admin session can create a staff account from email + password. Submitted role fields are ignored; created accounts are always staff.
- Both roles have the same Workspace operations. Admin alone can create/list accounts. Each user can change their own password after entering the current password. Password changes revoke every session for that user; they must sign in again. Sign out revokes the current session.
- Account creation and password-change events are logged without passwords. Existing business audit events retain their prior actor convention; account events identify the login.
- Staff emails are account identifiers supplied by the admin; no message or email is sent automatically.
- No automatic password recovery/reset is implemented. Keep the admin's current password safely. Admin/staff role changes, disabling accounts, and MFA are outside this revision.

## Deployment order

Apply the new schema migration (Sites applies it during publication), configure INITIAL_ADMIN_HASH, deploy while the platform gate is still owner-private, then expose the login page through the Site audience setting. API authorization remains mandatory after that audience change. Never remove the application session checks to make the login page reachable.

On the user's own Cloudflare account the same app works without a separate Access login. Bind the existing D1/R2 resources and set INITIAL_ADMIN_HASH as a Worker secret before first login. Preserve D1 auth_users/auth_sessions across deployments. Remove obsolete CF_ACCESS_* assumptions from earlier deployment instructions; Access can remain an optional additional gate if desired, but is not required by the app.

## Verified

SQLite schema and transaction tests, password salt/verification, invalid login rejection, secure cookie flags, same-origin mutation check, admin-only account creation, ignoring requested role escalation, staff cannot list users, password-change session revocation, logout and rate limiting. App UI and production build are checked separately during release.

## Embedded preview sessions

HTTPS sessions use HttpOnly, SameSite=None, Secure and Partitioned so login also works inside the ChatGPT preview iframe with third-party cookie blocking. Mutations still require an exact same-origin Origin header. HTTP local development uses SameSite=Lax. Sessions are partitioned by top-level site; opening Workspace in its own tab may require a separate login. A failed session refresh after correct credentials now shows an actionable error instead of silently returning to the login form.
