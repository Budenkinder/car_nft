# Plan 0028 — UUPS proxy for VinCidRegistry — Frontend

- **ADR:** `docs/adr/0028-vin-registry-uups-proxy.md`
- **Paired plan:** `docs/plans/in-progress/0028-vin-registry-uups-proxy-contracts.md`
- **Status:** in-progress
- **Date:** 2026-07-29

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No functional frontend code changes. The proxy pattern is transparent to callers: `frontend/src/utils/contract_utils.js:8-10` already reads `REACT_APP_SMART_CONTRACT_ADDRESS`/`REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` generically, and `pinata_ipfs_nft_service.js` calls contract methods through that address with whatever ABI is in `contract_abi.json` — none of that cares whether the address is a plain contract or a proxy. Scope here is limited to documentation/env-var handling changes that follow from the contracts side now producing a stable, set-once address plus a per-upgrade ABI refresh, and to manual verification that the existing UI still works end-to-end against a proxy-backed registry. Out of scope: any new UI surfacing contract "version" or upgrade history — noted as an open question below, not committed.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/.env.example` | modify | Update the comment above `REACT_APP_SMART_CONTRACT_ADDRESS(_LOCAL)` to note it is now the **proxy** address, set once at bootstrap and stable across upgrades (per ADR 0028) — no code change, comment only. |
| `frontend/src/utils/contract_utils.js` | no change | Already address-agnostic; confirmed during review, not modified. |
| `frontend/src/utils/pinata_ipfs_nft_service.js` | no change | Already calls through whatever address + ABI it's given; confirmed during review, not modified. |

## Tasks

- [x] **1.** Updated the comments in `frontend/.env.example` above `REACT_APP_SMART_CONTRACT_ADDRESS`, `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL`, and the `DEPLOY_BLOCK` vars to describe the new bootstrap-once/upgrade-preserves-address behavior.
- [x] **2.** *(Partially done — see note.)* After the paired contracts plan's local bootstrap + upgrade cycle, confirmed at the contract-call level (the same calls `pinata_ipfs_nft_service.js` makes — `getAllVins`/`getCidByVin`) that a VIN registered pre-upgrade is still readable post-upgrade, and that `npm start` compiles cleanly against the resynced ABI with zero frontend code changes. **Could not complete full wallet-driven browser click-through** ("Load Car NFT" / "Show all registered NFTs" / register-a-new-VIN clicked through an actual page with a connected wallet) — this container has no browser and no `chromium-cli`, and driving a Web3 wallet-connect flow headlessly was out of scope to build from scratch for this verification step. Recommend the user do one manual click-through against the local proxy-backed registry (address already in `frontend/.env.local`) before treating this as fully verified.
- [ ] **3.** *(Sepolia bootstrapped 2026-07-30 — this step is now the only thing left.)* Update `REACT_APP_SMART_CONTRACT_ADDRESS=0x9e30596A7C80754cd5149A465e89758CAdB0F8B3` and `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK=11385148` (per ADR 0027) in Vercel's Production environment variables, then trigger a redeploy of `main` so the new bundle picks it up. This is a manual Vercel-dashboard action outside the tools available in this session — the user needs to do it directly. Once done, this is a one-time step going forward: future `npm run upgrade:sepolia` runs leave this address unchanged.

## Interfaces with Contracts

- Functions called: unchanged — `storeCid`, `getCidByVin`, `getAllVins`, `getAllCidsAsList` (all called through the proxy address, same selectors as today).
- Events consumed: unchanged — `CidStored` (per ADR 0027's provenance work), emitted at the proxy address regardless of which implementation is currently active.
- ABI / address handoff: address now comes from a one-time bootstrap sync instead of every deploy; ABI still re-synced into `frontend/src/utils/contract_abi.json` on every contracts-side change (bootstrap **and** upgrade now, per the paired contracts plan's task 8), since an upgrade may add new methods the frontend could later choose to use.
- Network assumptions: unchanged (Sepolia `0xaa36a7`, local Hardhat `0x7a69`).

## Testing

- No new unit/component tests — no frontend logic changes.
- Manual verification steps: see Task 2 above (load / list / register, before and after a local upgrade cycle).
- How to verify against local Hardhat: run the contracts plan's bootstrap script, confirm the app works; run `scripts/upgrade.js`; confirm the app still works against the same address with no `.env.local` change and no dev-server restart required for the address (an ABI change, if any, would still need a restart to pick up the new `contract_abi.json`).

## Risks and Rollback

- Risk: none beyond the contracts-side risks already listed in the paired plan — the frontend has no logic depending on whether the target is a proxy or a plain contract.
- Rollback: none needed — no frontend code changes to revert. If the contracts side rolls back an upgrade, the frontend needs nothing beyond a possible `contract_abi.json` refresh if that upgrade had added methods the frontend didn't yet use.

## Open Questions

- Should the UI ever surface a contract "version" or "last upgraded" indicator (e.g. from a `version()`-style getter, if the contracts side adds one in a future upgrade)? Not committed — flagged here only so it isn't silently assumed in or out of scope later.
