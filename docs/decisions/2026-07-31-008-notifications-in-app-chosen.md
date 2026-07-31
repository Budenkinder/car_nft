---
date: 2026-07-31
scope: both
status: proposed
related_adr: 0033-in-app-notifications
supersedes: none
---

# Ship in-app, client-computed notifications with no new backend, deferring real push/email to a future ADR

## Context

The wishlist asked for transfer alerts and service-due reminders. This project has no backend today (static frontend + Hardhat-managed contracts) — real push/email notifications would require standing up one.

## Decision

Ship a wallet-scoped notification bell computed client-side from existing/soon-to-exist events (`Transfer` from ADR 0029, `RecordEntryAdded`/`SERVICE` timestamps from ADR 0030), with read/dismiss state in `localStorage`. No email, no push, no new backend.

## Alternatives Considered

- Real push/email via a new serverless-function + cron + email-provider backend, with a signature-verified email↔wallet opt-in — rejected for now; a genuinely new subsystem (event indexing, scheduling, secret management, email verification) disproportionate to this POC's current scale. Flagged explicitly as a future ADR if the user wants it.
- Browser Push API / service worker — rejected; still needs a backend to trigger a push when the user isn't on the page, so it doesn't avoid the new-infrastructure cost while adding its own complexity.

## Consequences

- Zero new infrastructure or cost; ships fast.
- Accepted limitation, stated explicitly: a previous owner who never reconnects that wallet will never see a transfer alert under this design — this is not solved, only deferred to a possible future ADR.
- The service-reminder half of this feature cannot ship until ADR 0030 lands; the transfer-alert half can ship independently sooner.
