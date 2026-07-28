---
date: 2026-07-26
scope: both
status: accepted
related_adr: 0017-readme-pdf-export
supersedes: none
---

## Context

User replied `autonomous` to plan 0017 (commit the generated README.md PDF export under `docs/`), which approves and starts implementation in one step.

## Decision

Move both `0017-readme-pdf-export-frontend.md` and `0017-readme-pdf-export-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0017's `Related plans:` paths to match.

## Alternatives considered

None — standard draft → in-progress transition, same pattern as plans 0011, 0012, 0015, 0016.

## Consequences

- Plan 0017 trio now lives in `docs/plans/in-progress/`.
- File placement proceeds next.
