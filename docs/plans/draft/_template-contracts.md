# Plan NNNN — <Title> — Contracts

- **ADR:** `docs/adr/NNNN-<slug>.md`
- **Paired plan:** `docs/plans/<status>/NNNN-<slug>-frontend.md`
- **GitHub Issue:** [#NN](https://github.com/Budenkinder/car_nft/issues/NN) (required from `approved/` onward — see CLAUDE.md §2a; omit while still in `draft/` if no issue is filed yet)
- **Status:** draft | approved | in-progress | done | rejected
- **Date:** YYYY-MM-DD

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

What this plan delivers in `contracts/` (and any Hardhat scripts under `scripts/`, config in `hardhat.config.js`, or deployment artifacts in `deployments/`). One paragraph. State explicitly what is **out of scope**.

If the contracts side has no changes for this request, state that here with a one-line justification (e.g., "UI-only change, no contract surface touched") and skip the remaining sections — but the file must still exist.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `contracts/...` | add / modify / delete | what changes |
| `scripts/...` | add / modify / delete | what changes |
| `hardhat.config.js` | modify | what changes |

## Tasks

Execute in order. Each task should be small enough to implement and review independently.

- [ ] **1.** <task description>
- [ ] **2.** <task description>
- [ ] **3.** <task description>

## Contract Surface

- New / changed functions: signatures, visibility, modifiers
- New / changed events: signature and indexed fields
- Storage layout changes (critical if any contract is upgradeable)
- Access control: who can call what
- Gas considerations: expected cost impact, optimizations

## Interfaces with Frontend

- ABI exports the frontend needs (where they are written)
- Deployed addresses (per network) handoff path
- Event shapes the frontend subscribes to

## Testing

- Hardhat unit tests (paths under `test/`)
- Fuzz / property tests if applicable
- Local deploy + integration check against the frontend
- Security checks: reentrancy, overflow, access control, signature replay

## Deployment and Migration

- Migration steps (new deploy vs. upgrade vs. parameter change)
- On-chain state migration script, if any
- Network sequence: localhost → testnet → mainnet
- Verification on Etherscan

## Risks and Rollback

- Risks (state corruption, unrecoverable funds, breaking ABI for existing UI clients)
- Rollback approach (pause, upgrade revert, redeploy)

## Open Questions

- Anything still unresolved that the user needs to answer before approval.
