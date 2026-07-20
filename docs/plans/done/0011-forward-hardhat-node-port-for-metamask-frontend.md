# Plan 0011 — Forward the local Hardhat node's port for MetaMask — Frontend

- **ADR:** `docs/adr/0011-forward-hardhat-node-port-for-metamask.md`
- **Paired plan:** `docs/plans/done/0011-forward-hardhat-node-port-for-metamask-contracts.md`
- **Status:** done
- **Date:** 2026-07-20

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

**No frontend code changes required.** `frontend/src/utils/contract_utils.js` already maps the Hardhat localhost chain id (`0x7a69` / 31337) to `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL`, and `frontend/.env.local` already has a non-empty `REACT_APP_PINATA_JWT` (needed for the IPFS pin step when registering/updating a car) — confirmed present, values not inspected. The only blocker to a full local end-to-end test was the missing `8545` port forward, fixed on the contracts side of this plan (`.devcontainer/devcontainer.json`). This file exists to satisfy the "plan both sides together" rule and to record the manual end-to-end verification steps for the local + Sepolia + MetaMask workflow the user asked for.

Out of scope: any `frontend/` source change.

## Files to Add / Modify

None.

## Tasks

None (verification-only, listed under Testing below).

## Interfaces with Contracts

Unchanged: `getContractAddress(chainId)` in `contract_utils.js` reads `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` (chain `0x7a69`) or `REACT_APP_SMART_CONTRACT_ADDRESS` (chain `0xaa36a7`, Sepolia) — both already populated (locally via `deploy:local`'s auto-write, Sepolia via the already-filled `.env`/Vercel values).

## Testing

Manual, end-to-end, once the contracts-side port forward (task 1–2 of the paired plan) lands:

**Local:**
1. `npm run node` (terminal 1) → `npm run deploy:local` (terminal 2) — writes `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` into `frontend/.env.local`.
2. In MetaMask (host browser): add network RPC `http://127.0.0.1:8545` (or VS Code's forwarded URL), chainId `31337`; import one of the test private keys `npm run node` prints.
3. `cd frontend && npm start` (restart if already running, so CRA picks up the new `.env.local` address).
4. Connect wallet in the app; confirm it shows the `minter` address matches (for register) or connect any account (for update); register a new VIN and confirm the mint transaction and CRT reward land in the test account.

**Sepolia:**
1. `npm run deploy:sepolia` (spends real testnet ETH — run only when ready).
2. Update Vercel's `REACT_APP_SMART_CONTRACT_ADDRESS` (production) or `frontend/.env.local` (local testing against Sepolia) with the new address; restart `npm start` if testing locally.
3. In MetaMask, switch to Sepolia; repeat the register/update flow against the live testnet contract.

## Risks and Rollback

None — no frontend code touched. Manual test steps only.

## Open Questions

None.
