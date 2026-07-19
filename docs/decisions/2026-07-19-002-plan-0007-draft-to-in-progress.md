---
date: 2026-07-19
scope: contracts
status: accepted
related_adr: 0007-hardhat-3-esm-migration
supersedes: none
---

# Plan 0007 transitioned draft → in-progress

## Context

User issued `implement` to begin executing plan 0007 (Hardhat 3 + ESM migration). Per CLAUDE.md workflow rule 2a, entering implementation moves the plan trio out of `draft/` into `in-progress/` before any task is executed.

## Decision

Moved both `0007-hardhat-3-esm-migration-frontend.md` and `0007-hardhat-3-esm-migration-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`. Updated `Status:` frontmatter and `Paired plan:` paths in both files, and rewrote ADR 0007's `Related plans:` paths to point at `in-progress/`.

## Alternatives Considered

- **Move now, before task 1** — chosen; matches the documented `draft/` → `in-progress/` entry criterion ("when implementation begins").
- **Wait until all tasks complete, then move once** — rejected; contradicts the explicit rule that the folder move happens at implementation start, not completion (that's the later `in-progress/` → `done/` transition).

## Consequences

- **Positive:** plan status folder accurately reflects that work has started.
- **Negative / accepted costs:** none.
- **Follow-ups required:** move trio to `done/` and bump ADR 0007 to `accepted` once all tasks in the contracts plan are complete.
