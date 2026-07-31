---
date: 2026-07-31
scope: both
status: accepted
related_adr: 0028-vin-registry-uups-proxy
supersedes: none
---

# Plan 0028 transitioned in-progress → done; ADR 0028 bumped proposed → accepted

## Context

Plan 0028's contracts side (all 10 tasks) was already complete, including the Sepolia bootstrap (`2026-07-30-003-sepolia-proxy-bootstrap.md`). The frontend side had one remaining task: manually updating `REACT_APP_SMART_CONTRACT_ADDRESS`/`REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` in Vercel's Production environment and redeploying `main` — a dashboard action outside the tools available in this session. The user confirmed today that this was done ("all done").

While preparing the transition, also found that ADR 0028's `Related plans:` paths still pointed at `docs/plans/draft/...` even though the plan pair moved `draft/ → in-progress/` on 2026-07-30 (`2026-07-30-002-plan-0028-draft-to-in-progress.md`) — that earlier transition missed the ADR-path rewrite step. Corrected in the same change rather than leaving it stale.

## Decision

- Marked frontend plan task 3 done in `docs/plans/in-progress/0028-vin-registry-uups-proxy-frontend.md` (per user confirmation), completing every task in both plan files of the 0028 trio.
- `git mv` both plan files to `docs/plans/done/`; updated each file's `Status:` frontmatter to `done` and `Paired plan:` path to the new folder.
- Updated `docs/adr/0028-vin-registry-uups-proxy.md`: `Related plans:` now point at `docs/plans/done/...` (correcting the stale `draft/` paths left over from the earlier transition); `Status:` bumped `proposed → accepted`, consistent with this project's convention that an ADR is accepted once its paired plans reach `done`.

## Alternatives Considered

- Leave the ADR's stale `draft/` path uncorrected and only fix the immediate `in-progress → done` move — rejected; the CLAUDE.md workflow requires ADR `Related plans:` paths to be accurate at every transition, and leaving a two-transitions-old broken link would only compound.

## Consequences

- Plan 0028 (UUPS proxy for `VinCidRegistry`) is now fully shipped on both sides: contracts (implemented, tested locally, bootstrapped on Sepolia) and frontend (env-var docs updated, contract-call-level verification done, Vercel Production env vars updated and redeployed).
- `docs/plans/done/` and the ADR are now consistent; no further action needed on this plan unless a follow-up ADR/plan is opened.
- Outstanding from the paired contracts plan (not blocking, called out there as a follow-up): the Sepolia **upgrade** path (`npm run upgrade:sepolia`) has been implemented and tested on `localhost`, but not yet exercised on Sepolia itself.
