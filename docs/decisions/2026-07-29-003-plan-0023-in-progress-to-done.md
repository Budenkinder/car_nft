---
date: 2026-07-29
scope: frontend
status: accepted
related_adr: 0023-recipient-field-label-tuv
supersedes: none
---

## Context

Plan 0023 (relabel the recipient field to "TÜV Car Inspection Wallet Address") had both tasks checked `[x]` in `docs/plans/in-progress/`. Git history confirms the change landed in `d844730` (relabel recipient field to "TÜV Car Inspection Wallet Address" in mint form), and the current `frontend/src/App.js:383` label reads `"TÜV Car Inspection Wallet Address (recipient)"`. The user confirmed this is implemented and asked for plan status to be reviewed.

## Decision

Transition plan 0023 (both `-frontend.md` and `-contracts.md`) from `in-progress` to `done`:

1. `git mv` both files to `docs/plans/done/`.
2. Updated both files' `Status:` frontmatter to `done` and `Paired plan:` paths to the new folder.
3. Rewrote ADR 0023's `Related plans:` paths to point at `docs/plans/done/`.

## Alternatives considered

- None — the label change is a single-line copy edit already merged and verified against the current source; no ambiguity to resolve.

## Consequences

`docs/plans/done/` now reflects that this label change has shipped.
