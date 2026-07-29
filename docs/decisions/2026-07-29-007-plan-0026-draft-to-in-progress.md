---
date: 2026-07-29
scope: frontend
status: accepted
related_adr: 0026-clear-form-after-successful-registration
supersedes: none
---

## Context

User replied "Implement 0026 autonomously", which per `CLAUDE.md` both approves and starts implementation in one step (`autonomous` mode works through the plan's tasks start to finish without stopping between them).

## Decision

Move both `0026-clear-form-after-successful-registration-frontend.md` and `-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0026's `Related plans:` paths to match — following the established draft → in-progress precedent (e.g. plans 0015, 0018, 0020) of routing directly through `in-progress` rather than a separate `approved` stage. ADR 0026 stays `proposed` at this step; it bumps to `accepted` only once the plan reaches `done`, per this repo's existing pattern.

The plan's Open Question (whether to also reset `vinExistsOnChain`/`vinLastCid`/the search `vin` field) is not blocking: the plan's Scope and Goals section already explicitly excludes that broader reset from this plan's task list, so implementing the plan as written does not require resolving it first.

## Alternatives considered

- Route through `docs/plans/approved/` first — rejected as unnecessary ceremony, matching this repo's established precedent.
- Pause to resolve the Open Question before starting — rejected; the open question concerns a *larger* reset than what this plan implements, so it doesn't change or block the 8-field reset this plan actually specifies.

## Consequences

- Plan 0026 trio now lives in `docs/plans/in-progress/`.
- Implementation of the single frontend task (conditional field reset in `handleSubmit`) proceeds next.
