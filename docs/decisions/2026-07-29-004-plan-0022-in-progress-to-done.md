---
date: 2026-07-29
scope: frontend
status: accepted
related_adr: 0022-document-compensating-unpin-in-readme
supersedes: none
---

## Context

Plan 0022 (document the compensating-unpin behavior in README's Architecture write flow) had its only task checked `[x]` and no open questions. The user asked for all `in-progress` plans to be reviewed and moved to the correct status if complete.

## Decision

Verified `README.md:31` contains exactly the documented "On-chain failure after a successful pin" write-flow step, with the following steps renumbered (4→5, 5→6) as specified. Transitioned plan 0022 (both `-frontend.md` and `-contracts.md`) from `in-progress` to `done`:

1. `git mv` both files to `docs/plans/done/`.
2. Updated both files' `Status:` frontmatter to `done` and `Paired plan:` paths to the new folder.
3. Rewrote ADR 0022's `Related plans:` paths to point at `docs/plans/done/`.

## Alternatives considered

- None — documentation-only change, already merged and verified verbatim against the live file.

## Consequences

`docs/plans/done/` now reflects that this documentation fix has shipped.
