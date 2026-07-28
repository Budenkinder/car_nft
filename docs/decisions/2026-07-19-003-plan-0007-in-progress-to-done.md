---
date: 2026-07-19
scope: contracts
status: accepted
related_adr: 0007-hardhat-3-esm-migration
supersedes: none
---

# Plan 0007 transitioned in-progress → done; ADR 0007 bumped proposed → accepted

## Context

User issued `autonomous`, so all remaining tasks in plan 0007 (contracts) were executed back to back: rewrote `hardhat.config.js` and `scripts/deploy.js` as ESM against the Hardhat 3 API, then verified with `npm run compile` (succeeded, produced `artifacts/contracts/car_nft_sc.sol/VinCidRegistry.json`) and `npm run deploy:local` against a local `hardhat node` (both contracts deployed, registry funded, `deployments/localhost.json` written, `frontend/.env.local` and `frontend/src/utils/contract_abi.json` updated in their existing formats). All 5 tasks in the contracts plan are checked off; the frontend plan was a no-op from the start.

## Decision

Moved both `0007-hardhat-3-esm-migration-frontend.md` and `0007-hardhat-3-esm-migration-contracts.md` from `docs/plans/in-progress/` to `docs/plans/done/`. Updated `Status:` frontmatter and `Paired plan:` paths in both files. Bumped ADR 0007 from `proposed` to `accepted` and rewrote its `Related plans:` paths to `done/`.

## Alternatives Considered

- **Move to `done/` now that every task is checked off** — chosen; matches the documented `done/` criterion ("every task complete and the matching code merged").
- **Leave in `in-progress/` pending a live Sepolia deploy check** — rejected; the plan's own testing section marks the Sepolia deploy/verify check as optional ("not required to close this plan since Sepolia deploys touch real funds/state"), so it is not a blocker to `done`.

## Consequences

- **Positive:** `npm run compile` and `npm run deploy:local` work again on Hardhat 3 + ESM; the plan trio's folder state accurately reflects completed work.
- **Negative / accepted costs:** the optional Sepolia end-to-end check (`npm run deploy:sepolia` + `npx hardhat verify`) was not exercised, since it requires real testnet funds/RPC credentials.
- **Follow-ups required:** none blocking. If a Sepolia deploy is attempted later and something in the `verify`/network config needs adjustment, file it as a new decision at that time.
