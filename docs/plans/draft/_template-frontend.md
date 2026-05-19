# Plan NNNN — <Title> — Frontend

- **ADR:** `docs/adr/NNNN-<slug>.md`
- **Paired plan:** `docs/plans/<status>/NNNN-<slug>-contracts.md`
- **Status:** draft | approved | in-progress | done | rejected
- **Date:** YYYY-MM-DD

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

What this plan delivers in the `frontend/` project. One paragraph. State explicitly what is **out of scope**.

If the frontend has no changes for this request, state that here with a one-line justification (e.g., "ABI unchanged, no new events consumed") and skip the remaining sections — but the file must still exist.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/...` | add / modify / delete | what changes |

## Tasks

Execute in order. Each task should be small enough to implement and review independently.

- [ ] **1.** <task description>
- [ ] **2.** <task description>
- [ ] **3.** <task description>

## Interfaces with Contracts

- Functions called: `<contract>.<method>(args) -> returns`
- Events consumed: `<EventName>(args)`
- ABI / address handoff: where the frontend reads the ABI and deployed address from
- Network assumptions: chain id(s), RPC

## Testing

- Unit / component tests
- Manual verification steps (wallet connection, tx submission, error paths, loading states)
- How to verify against a local Hardhat node

## Risks and Rollback

- Risks (UX regressions, wallet incompatibilities, RPC issues)
- Rollback approach (feature flag, revert PR, etc.)

## Open Questions

- Anything still unresolved that the user needs to answer before approval.
