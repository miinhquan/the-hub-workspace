# The Hub AI Agent · Phase A

An isolated React + TypeScript experience with a custom Three.js shader orb, Motion transitions, four mock conversations, tour browsing, and an authenticated Effects Studio. No OpenAI, MiraiAPI, microphone, camera, WhatsApp, or production database calls are made.

## Preview

- Visitor: https://codex-ai-agent-phase-a-the-hub-ai-agent.quannguyenminh97.workers.dev/ai
- Studio: https://codex-ai-agent-phase-a-the-hub-ai-agent.quannguyenminh97.workers.dev/ai/admin/effects
- Branch: `codex/ai-agent-phase-a`

The Cloudflare Worker parent has its production `workers.dev` route **disabled** and no production deployment. The named Cloudflare **Preview** has its own secrets and a dedicated KV namespace. Existing Workers, DNS, routes, customer data, and root workspace configuration remain untouched. `cloudflare.preview.json` records the preview identity; it contains no secrets.

The connected Sites publishing workflow was considered but not used: Sites deployments are production deployments, while the request authorizes a Cloudflare preview only. The existing root `.openai/hosting.json` is retained unchanged.

## Run locally

Node 22.13+ is required. This package installs independently from the workspace root.

```sh
cd apps/ai-agent
npm ci
npm run init:local
npm run dev
```

Open `http://127.0.0.1:4173/ai`. The generated `.local/admin-password.txt` signs into the local Studio. `.local/session-secret.txt` signs the admin cookie. Both files are ignored by Git. The development server binds only to loopback and emulates API persistence with checkout-local files. Local server storage is unrelated to preview KV.

```sh
npm run check       # ESLint, 27 automated tests, TypeScript, Vite, Worker bundle
npm run format      # Format source for review
```

The preview admin password is generated outside source and bound as a Cloudflare secret. It is provided to the owner through the local handoff file, never committed or included in frontend assets.

## Modules

| Module | Responsibility |
|---|---|
| `src/components/Experience.tsx` | Welcome, liquid expansion, Home, conversation and kiosk controls |
| `src/components/Orb.tsx` | Original animated GLSL sphere, simulated amplitude, adaptive pixel ratio, context fallback and resource disposal |
| `src/components/TourCards.tsx` | Touch scrolling, mouse drag with inertia, snapping, stagger/blur entrance, filtered replacement and native modal details |
| `src/config.ts` | All effect defaults, inspector metadata and shared runtime validation |
| `src/engine/machine.ts` | Legal conversation transitions and simulated amplitude |
| `src/engine/useSimulation.ts` | Cancelable scenario timers, pause/resume/step/replay, timeline and manual state previews |
| `src/engine/providers.ts` | Mock conversation/tour providers and future provider contracts |
| `src/components/EffectsEditor.tsx` | Protected editor, live canvas, presets, JSON, draft/publish and simulation controls |
| `worker/api.ts` | Server authorization, sessions, rate limiting, persistence and response security policy |
| `scripts/build-worker.mjs` | Packages the static build with the Worker API as one portable ESM bundle |

`Tap to Start` only opens Home. A separate explicit interaction starts the mock session. Admin state shortcuts deliberately override the machine and log `Manual preview` events; normal scenarios use validated transitions.

## Preview updates

1. Work on the same feature branch; run `npm run check`.
2. Commit and push the exact source to the feature branch.
3. Use the connected Cloudflare API to create a new deployment under the **existing preview ID** in `cloudflare.preview.json`. Upload `dist/server/index.js` as a JavaScript module. Keep the preview's `CONFIG`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `LOGIN_RATE` bindings.
4. Keep the same named preview URL and PR. Verify the URL, unauthorized publish rejection, Studio login, and asset loading.
5. Do not call a parent Worker production deployment endpoint, change production routes, bind an existing production database, merge `main`, or publish the root Site.

The API rejected the client-date compatibility setting, so this preview uses the supported baseline `2025-11-01`; no newer runtime feature is required. The bundle embeds its assets to keep API-based preview uploads self-contained. A future production build should evaluate native Workers Static Assets for CDN delivery and smaller Worker modules.

## Verification and limits

Tests cover configuration validation, every scenario's legal states, bounded voice amplitude, mock function calls, tour filtering, session signatures/expiry, auth and CSRF rejection, secret-missing failure, request size bounds, rate limiting, draft/published isolation, timer pause/resume/replay/reset and unmount cleanup.

Browser QA covers Welcome → Home without starting playback, automatic tour presentation, details dialog, return to orb, end/reset, Studio login, live size changes, draft and preset persistence, desktop/mobile layouts and WebGL console errors. No physical kiosk hardware or sustained device-specific FPS benchmark is claimed. Automatic graphics quality reduces pixel ratio after slow frames; reduced motion honors both the OS setting and the Studio toggle. The renderer stops drawing while hidden or offscreen and disposes GPU resources on unmount.

KV is eventually consistent. Publishing may take up to roughly a minute to reach another edge location; visitor tabs fetch published settings when opened/reloaded. Browser draft recovery is specific to this origin and device. Preview admin access is a single shared high-entropy password with an eight-hour signed cookie; organization SSO and per-admin audit history are future production decisions. Native rate limiting is per Cloudflare location; the KV failed-login guard is an additional best-effort check.

See [Effects Studio guide](docs/effects-studio.md), [Phase B integration boundary](docs/phase-b.md), and [asset credits](docs/assets.md).
