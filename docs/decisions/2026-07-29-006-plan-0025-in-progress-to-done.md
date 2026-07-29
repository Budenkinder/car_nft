---
date: 2026-07-29
scope: frontend
status: accepted
related_adr: 0025-readme-stale-recipient-label
supersedes: none
---

## Context

Plan 0025 (README: sync stale recipient label) had both tasks checked `[x]` and no open questions. The user asked for all `in-progress` plans to be reviewed and moved to the correct status if complete.

## Decision

Verified `README.md:273` reads `**TÜV Car Inspection Wallet Address (recipient)**`, matching the label already live in `frontend/src/App.js` since ADR 0023. Transitioned plan 0025 (both `-frontend.md` and `-contracts.md`) from `in-progress` to `done`:

1. `git mv` both files to `docs/plans/done/`.
2. Updated both files' `Status:` frontmatter to `done` and `Paired plan:` paths to the new folder.
3. Rewrote ADR 0025's `Related plans:` paths to point at `docs/plans/done/`.

## Alternatives considered

- None — single-string documentation sync, already merged and verified against the live file.

## Consequences

`docs/plans/done/` now reflects that this documentation fix has shipped. All plans previously in `docs/plans/in-progress/` (0018, 0020, 0022, 0023, 0024, 0025) are now in `docs/plans/done/`; the `in-progress/` folder is empty aside from its `README.md`.
