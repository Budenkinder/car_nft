---
date: 2026-07-19
scope: both
status: accepted
related_adr: 0008-readme-hardhat3-devcontainer-docs
supersedes: none
---

# Plan 0008 transitioned draft → in-progress

## Context

User issued `autonomous` to execute plan 0008 (README updates documenting the Hardhat 3 migration and the Dev Container). Per CLAUDE.md workflow rule 2a, entering implementation moves the plan trio out of `draft/` into `in-progress/` before any task is executed.

## Decision

Moved both `0008-readme-hardhat3-devcontainer-docs-frontend.md` and `0008-readme-hardhat3-devcontainer-docs-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`. Updated `Status:` frontmatter and `Paired plan:` paths in both files, and rewrote ADR 0008's `Related plans:` paths to point at `in-progress/`.

## Alternatives Considered

- **Move now, before task 1** — chosen; matches the documented `draft/` → `in-progress/` entry criterion.
- **Skip the folder move since this is "just a README edit"** — rejected; CLAUDE.md explicitly disallows skipping the workflow for small changes.

## Consequences

- **Positive:** plan status folder accurately reflects that work has started.
- **Negative / accepted costs:** none.
- **Follow-ups required:** move trio to `done/` and bump ADR 0008 to `accepted` once both README tasks are complete.
