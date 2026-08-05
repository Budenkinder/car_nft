# ADR 0033: In-app, wallet-scoped notifications for transfers and service reminders (no new backend)

- **Status:** proposed
- **Date:** 2026-07-31
- **Scope:** both
- **Related plans:**
  - `docs/plans/draft/0033-in-app-notifications-frontend.md`
  - `docs/plans/draft/0033-in-app-notifications-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-31-008-notifications-in-app-chosen.md`

## Context

The wishlist asked for two things: alerting the previous owner or a service center when a transfer happens, and reminders for upcoming service/inspection based on the last logged date. Real push notifications (email/SMS/web-push) require infrastructure this project does not have: a way to bind an email or push subscription to a wallet address, a backend that watches on-chain events continuously (not just on page load), and a scheduler to fire time-based reminders even when nobody has the app open. This project today is a purely static frontend (Create React App, deployed to Vercel) plus Hardhat-managed contracts — there is no server component anywhere.

## Decision

Ship a wallet-scoped, in-app notification center with **no new backend and no email/SMS**: on wallet connect / page load, the frontend scans recent `Transfer` events (ADR 0029) involving the connected address (either direction) and, once ADR 0030 ships, recent `RecordEntryAdded` events for VINs the wallet currently owns, plus a client-computed "service may be due" reminder comparing the latest `SERVICE` entry's timestamp against a fixed interval. Results render in a notification-bell dropdown; read/dismissed state is kept in `localStorage`, following the existing precedent of client-only persisted UI state (theme mode). This explicitly does **not** notify a previous owner who never reopens the app with that wallet connected, and does not notify any party by email — both are named, accepted limitations, not oversights.

## Options Considered

### Option A — In-app notification center, client-computed, no backend (chosen)
- **Pros:** Ships with zero new infrastructure, zero new secrets/cost, fits this project's existing all-static architecture exactly; reuses event-reading utilities already built for ADR 0029/0030; delivers real, visible value (a seller who reconnects their wallet sees "your car was transferred," an owner sees "service may be due").
- **Cons:** Not proactive — nothing reaches a user who doesn't open the app with the relevant wallet connected. A previous owner has no reason to ever reconnect that wallet again, so they would realistically never see a post-sale alert under this option.

### Option B — Real push/email notifications via a new lightweight backend (serverless function + cron + an email provider, with a signature-verified email↔wallet opt-in)
- **Pros:** Actually reaches users proactively, including a previous owner with no reason to reopen the app.
- **Cons:** A genuinely new subsystem: server-side event indexing, a cron trigger, an email/SMS provider account with its own API key/secret management, and a trustworthy way to bind an email address to a wallet (typically a signed-message opt-in flow) — meaningfully larger scope, ongoing cost, and new attack surface (email spoofing/verification) than anything else in this roadmap. Not adopted now; flagged as the natural next ADR if the user wants real push/email later.

### Option C — Browser Push API / Web Notifications via a service worker
- **Pros:** Feels more "native" than an in-app dropdown.
- **Cons:** Still requires *some* backend to trigger a push when the user isn't on the page — it doesn't actually avoid the infrastructure Option B needs, while adding its own complexity (service-worker lifecycle, push-subscription storage, and CRA's service worker is currently unregistered in this project). Worse cost/benefit than B if real push is ever wanted; rejected.

## Consequences

- **Positive:** Delivers visible notification value today with zero new infrastructure or cost, consistent with this project's architecture.
- **Negative / accepted costs:** A previous owner who sells and never reconnects that wallet will never see a transfer alert under this design — explicitly accepted, not solved, by this ADR. Reminders are heuristic (a fixed interval), not tied to any real inspection-due-date authority.
- **Frontend impact:** New notification-computation utility, new bell/dropdown component, `localStorage`-backed read state.
- **Contracts impact:** None — purely reads existing/soon-to-exist events.
- **Follow-ups:** Option B (real push/email) is a natural, larger follow-up ADR if the user decides proactive off-app notification is worth the new infrastructure. This ADR's transfer-alert half only needs ADR 0029; its service-reminder half needs ADR 0030 to have shipped first — the paired plans should note this as a partial-rollout sequencing dependency, not a blocker to building the transfer-alert half sooner.

## References

- `docs/adr/0029-ownership-history-public-lookup.md` — the `Transfer`-event reconstruction this reuses.
- `docs/adr/0030-structured-vehicle-record.md` — the `RecordEntryAdded` events and `SERVICE` entry timestamps this reuses for reminders.
- `docs/decisions/2026-05-19-001-frontend-theme-mode-toggle.md` — the existing `localStorage`-backed client-state precedent this follows.
