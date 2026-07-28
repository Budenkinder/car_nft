# Plan 0019 — Keep the local Hardhat node alive across terminal restarts — Frontend

- **ADR:** `docs/adr/0019-persistent-local-hardhat-node.md`
- **Paired plan:** `docs/plans/draft/0019-persistent-local-hardhat-node-contracts.md`
- **Status:** draft
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No frontend changes required. This request is purely about how the local `hardhat node` process is started/stopped (Dev Container `postStartCommand` + two new shell scripts, see the paired contracts plan) — it changes nothing about how the frontend talks to the chain. The frontend already reads the deployed contract address from `frontend/.env.local` (`REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL`), which `scripts/deploy.js` writes on every deploy; that mechanism is untouched. A side effect worth noting (not a code change): once the node survives terminal restarts, the frontend will keep working against the same address across those restarts too, without needing a redeploy — but that's a consequence of the contracts-side change, not something the frontend needs to do anything for.

## Files to Add / Modify

None.

## Tasks

None — no-op for this plan.

## Interfaces with Contracts

- Unchanged. Frontend continues to read `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` from `frontend/.env.local` and the ABI from `frontend/src/utils/contract_abi.json`, both written by `scripts/deploy.js` exactly as before.

## Testing

- Not applicable — no frontend code changes to test. (Manual confirmation that the frontend still connects correctly across a terminal restart is covered by the paired contracts plan's testing section.)

## Risks and Rollback

- None — no frontend surface touched.

## Open Questions

None.
