# Plan 0005 — Deploy script syncs the frontend (address + ABI) — Frontend

- **ADR:** `docs/adr/0005-deploy-script-frontend-sync.md`
- **Paired plan:** `docs/plans/done/0005-deploy-script-frontend-sync-contracts.md`
- **Status:** done
- **Date:** 2026-05-21

> Plan files live in a subfolder named after their `Status:` value. New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

**No frontend source code changes.** Justification: the work is entirely in `scripts/deploy.js` (see the paired contracts plan). Two files under `frontend/` become **deploy-script outputs** rather than hand-maintained files:

- `frontend/.env.local` — gitignored; the deploy script upserts `REACT_APP_SMART_CONTRACT_ADDRESS` (sepolia) / `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` (localhost).
- `frontend/src/utils/contract_abi.json` — committed, but now **generated**: overwritten from the compiled artifact on every deploy. Do not hand-edit it going forward.

`frontend/src/utils/contract_utils.js` already reads the two `REACT_APP_*` address vars and the app already imports `contract_abi.json` — no code change is needed on the frontend side.

## Tasks

- [x] **1.** No-op for `frontend/src/`. After the contracts plan's `scripts/deploy.js` change lands, verify `cd frontend && CI=true npm run build` still compiles with the (re-generated) `contract_abi.json`.

## Interfaces with Contracts

- Functions called: unchanged (the list/lookup/mint calls from ADR 0004 and earlier).
- ABI / address handoff: `contract_abi.json` and `.env.local` are now written by `scripts/deploy.js`; the frontend continues to consume them through the existing `contract_utils.js` import path.
- Network assumptions: unchanged — Sepolia `0xaa36a7`, Hardhat `0x7a69`.

## Testing

- After the deploy-script change: run `npm run deploy:local`, restart `npm start`, confirm the app resolves the contract on Hardhat with no "No contract address configured" warning.
- After `npm run deploy:sepolia`: confirm `frontend/.env.local` now carries a non-empty `REACT_APP_SMART_CONTRACT_ADDRESS`, restart `npm start`, connect MetaMask to Sepolia, confirm contract reads work.

## Risks and Rollback

- **Risk:** a regenerated `contract_abi.json` with drifted formatting shows a noisy git diff — mitigated in the contracts plan by matching the existing format.
- **Rollback:** none needed on the frontend — there is no frontend source change.

## Open Questions

- None.
