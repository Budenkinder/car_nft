---
date: 2026-07-20
scope: both
status: accepted
related_adr: 0011-forward-hardhat-node-port-for-metamask
supersedes: none
---

# Plan 0011 transitioned draft → in-progress

## Context

User issued `autonomous` to execute plan 0011 (forward port 8545 for MetaMask). Per CLAUDE.md workflow rule 2a, entering implementation moves the plan trio out of `draft/` into `in-progress/` before any task is executed.

## Decision

Moved both `0011-forward-hardhat-node-port-for-metamask-frontend.md` and `0011-forward-hardhat-node-port-for-metamask-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`. Updated `Status:` frontmatter and `Paired plan:` paths in both files, and rewrote ADR 0011's `Related plans:` paths to point at `in-progress/`.

## Alternatives Considered

- **Move now, before task 1** — chosen; matches the documented entry criterion.
- **Skip the folder move** — rejected; CLAUDE.md disallows skipping the workflow.

## Consequences

- **Positive:** plan status folder accurately reflects that work has started.
- **Negative / accepted costs:** none.
- **Follow-ups required:** move trio to `done/` and bump ADR 0011 to `accepted` once both tasks are complete.
