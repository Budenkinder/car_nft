---
date: 2026-07-30
scope: both
status: accepted
related_adr: 0028-vin-registry-uups-proxy
supersedes: none
---

# Plan 0028 transitioned draft → in-progress; autonomous implementation begins

## Context

User replied "accept as one-time loss. Continue as autonomous" — resolving plan 0028's last open question (see `2026-07-30-001-accept-sepolia-data-loss-at-cutover.md`) and, per `CLAUDE.md`, both approving and starting implementation in one step via the `autonomous` command.

## Decision

Move both `0028-vin-registry-uups-proxy-frontend.md` and `-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`, update their `Status:` frontmatter and `Paired plan:` paths — following the established draft → in-progress precedent from decisions `2026-07-19-005`, `2026-05-21-005`/`008`, and `2026-07-29-009` (route directly to `in-progress`, skip `approved/` as unnecessary ceremony). ADR 0028 stays `proposed`; it bumps to `accepted` once the plan reaches `done`. Implementation proceeds autonomously, task by task, per the contracts plan's ordering (dependency/mocks/tests first, then scripts), then the frontend plan's verification tasks.

## Alternatives Considered

- Route through `docs/plans/approved/` first — rejected as unnecessary ceremony, matching established precedent.

## Consequences

- Plan 0028 trio now lives in `docs/plans/in-progress/`.
- Implementation proceeds contracts-first (contract rewrite, mocks, tests, then bootstrap/upgrade scripts), then frontend (doc comment + manual verification), since the frontend plan has no code dependent on contract internals beyond the already-generic address/ABI wiring.
