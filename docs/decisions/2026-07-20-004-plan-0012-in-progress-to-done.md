---
date: 2026-07-20
scope: both
status: accepted
related_adr: 0012-readme-session-learnings
supersedes: none
---

# Plan 0012 transitioned in-progress → done; ADR 0012 bumped proposed → accepted

## Context

User issued `autonomous`; both tasks in plan 0012 were executed: a "No contracts to compile" entry was added to `README.md`'s Troubleshooting section, and a note clarifying `ethers` is unused in the frontend (all contract calls go through `web3`) was added to the Frontend section's stack description.

## Decision

Moved both `0012-readme-session-learnings-frontend.md` and `0012-readme-session-learnings-contracts.md` from `docs/plans/in-progress/` to `docs/plans/done/`. Bumped ADR 0012 from `proposed` to `accepted` and rewrote its `Related plans:` paths to `done/`.

## Alternatives Considered

- **Move to `done/` now that both tasks are checked off** — chosen; matches the documented `done/` criterion.

## Consequences

- **Positive:** both session learnings are now documented directly in `README.md`.
- **Negative / accepted costs:** none.
- **Follow-ups required:** none blocking. If `ethers` is later removed or actually adopted in the frontend, revisit the README note added here.
