# Plan 0004 — List all registered NFTs (VIN → CID) — Contracts

- **ADR:** `docs/adr/0004-frontend-list-all-registered-nfts.md`
- **Paired plan:** `docs/plans/done/0004-frontend-list-all-registered-nfts-frontend.md`
- **Status:** done
- **Date:** 2026-05-21

> Plan files live in a subfolder named after their `Status:` value. New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

**No contract-side changes required.** Justification: the registry already exposes the two `view` functions the frontend needs — `getAllVins()` and `getAllCidsAsList()` (`contracts/car_nft_sc.sol:106-116`) — and both are already present in the frontend ABI (`frontend/src/utils/contract_abi.json`). This feature only consumes existing read functions; no Solidity, Hardhat script, `hardhat.config.js`, deployment, or ABI change is needed.

Out of scope: any change to `contracts/`, `scripts/`, `hardhat.config.js`, or `deployments/`.

## Notes

- If plan 0003 (local-redeploy + ABI auto-sync) later runs, its re-export of the ABI is harmless here: the contract source is unchanged, so the re-synced `contract_abi.json` still declares `getAllVins`/`getAllCidsAsList` identically.
- No new Hardhat tests are added; existing contract behaviour is unchanged. (There is no `test/` directory today — adding one remains its own ADR.)
