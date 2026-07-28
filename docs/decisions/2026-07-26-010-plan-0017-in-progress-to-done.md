---
date: 2026-07-26
scope: both
status: accepted
related_adr: 0017-readme-pdf-export
supersedes: none
---

## Context

The single task in plan 0017 (contracts side) — copy the generated README PDF into `docs/README.pdf` — is complete.

## Decision

Move both `0017-readme-pdf-export-frontend.md` and `0017-readme-pdf-export-contracts.md` from `docs/plans/in-progress/` to `docs/plans/done/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0017's `Related plans:` paths to match. ADR 0017 was already `accepted`, so no status bump needed.

## Alternatives considered

None — completion of a single-task plan.

## Consequences

- Plan 0017 trio now lives in `docs/plans/done/`.
- `docs/README.pdf` exists in the repo (8 pages, verified page-by-page during generation).
