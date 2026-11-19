# Phase B integration boundary — design only

Phase A uses `MockProvider` and `MockTourProvider`. No Phase B service is implemented, enabled, or paid for.

## Replace the provider, retain the interface

Implement `RealtimeProvider` behind `ConversationProvider`. It declares `connect(signal)`, `mute`, `disconnect`, and `dispose`; the interface should evolve into an event subscription for transcripts, VAD, amplitude, state events, and function results before a real adapter is connected. The current scenario player is deliberately a mock-specific timer adapter. A production orchestration hook will consume provider events while preserving the visual components, effect configuration, tour provider and conversation machine.

The UI must ask for an explicit user action before a server connection and microphone permission. `Tap to Start` remains navigation only. The current preview enforces `Permissions-Policy: microphone=(), camera=()`; change that only for an approved real-voice environment. Do not silently enable permissions or request a device stream in Phase A.

## Worker responsibilities

- Store provider credentials only as Worker secrets. Issue short-lived scoped client sessions server-side after consent and rate checks; never send a long-lived API key to the browser.
- Validate all tool arguments and results, enforce allowlisted operations, and associate each conversation with a short-lived server session.
- Route verified tour queries through `TourProvider`, using only The Hub-approved records. Price, itinerary and seat availability must carry confirmation/source timestamps and explicit unknown states.
- Queue a proposed inquiry separately from a confirmed booking. Add human approval before WhatsApp delivery, Workspace writes, reservations or commitments.
- Define retention, transcript redaction and deletion behavior before recording or storing visitor data. Logs must exclude keys, audio and unnecessary personal data.

## Lifecycle and state

The normal state graph is `WELCOME → HOME → SESSION_STARTING → LISTENING → THINKING → SPEAKING → SHOWING_CONTENT → LISTENING → SESSION_ENDING → WELCOME`, with explicit early end transitions and speaking/listening loops. Disconnect, permission denial, device loss and network timeout will need additional recoverable error events; they must stop audio and return to a clear user-controlled state.

Use a single session cancellation scope to release tracks, speakers, AudioContexts, WebRTC connections, sockets and subscriptions on end/reset/unmount/visitor departure. Orb rendering should consume a smoothed real amplitude stream instead of `amplitude()` and keep its current shader/config contract. The current simulated Mute only changes visual amplitude and logs an event; it does not control audio.

## Production prerequisites

Require the user's approval for Phase B and paid APIs. Verify the current official OpenAI Realtime integration documentation at that time. Decide production identity (for example Cloudflare Access/SSO), per-admin auditing, session revocation, deployment approval, database resource isolation, abuse limits, cost caps, kiosk hardware and presence-sensor privacy before enabling any real integration. Camera-based presence detection remains outside Phase A.

The initial inspection could reach `www.thehub.express` and `ws.thehub.express`; `tours.thehub.express` failed DNS resolution from the development environment. No DNS or existing Worker settings were changed in response.
