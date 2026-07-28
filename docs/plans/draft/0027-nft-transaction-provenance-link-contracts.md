# Plan 0027 — NFT transaction provenance link — Contracts

- **ADR:** `docs/adr/0027-nft-transaction-provenance-link.md`
- **Paired plan:** `docs/plans/draft/0027-nft-transaction-provenance-link-frontend.md`
- **Status:** draft
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No Solidity changes (ADR 0027 Option A — `CidStored` already carries everything needed via its transaction receipt). The only change is to `scripts/deploy.js`: record the registry's deployment block number so the frontend can bound its `CidStored` event scan with `fromBlock` instead of scanning from genesis. Out of scope: adding `indexed` fields to any event (ADR 0027 Option B, explicitly deferred); any change to `contracts/car_nft_sc.sol` or `contracts/car_reward_token.sol`.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `scripts/deploy.js` | modify | Capture `registry`'s deployment block number; add `deployedAtBlock` to the `artifact` object (written to `deployments/<network>.json`); sync a new env var into `frontend/.env.local`; include the block number in the Sepolia deploy log markdown. |
| `frontend/.env.example` | modify | Document the two new optional env vars. |

## Tasks

- [ ] **1.** In `scripts/deploy.js`, after `await registry.waitForDeployment()` (current line 44), capture the deployment block number (e.g. via `registry.deploymentTransaction().blockNumber`, falling back to `(await registry.deploymentTransaction().wait()).blockNumber` if not yet populated at that point — confirm which is reliable under Hardhat 3/ethers v6 at implementation time).
- [ ] **2.** Add `deployedAtBlock: <number>` to the `artifact` object (current lines 50-58), so it's written into `deployments/<network>.json` alongside the existing fields.
- [ ] **3.** In the "Frontend wiring" section (current lines 94-114), sync the block number the same way the address is synced: `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL` for `localhost`/`hardhat`, `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` for `sepolia`, via the existing `upsertEnvVar` helper. For Sepolia, also print the var in the "also set in Vercel" console block (current lines 106-110) so it isn't missed during the manual Vercel step.
- [ ] **4.** Add `deployedAtBlock` as a row in the Sepolia deploy log markdown template (current `logBody`, lines 128-140).
- [ ] **5.** Add `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` and `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL` to `frontend/.env.example` with a one-line comment (optional; used to bound the transaction-history event scan).

## Contract Surface

Unchanged — no new/changed functions or events. `CidStored(string vin, string cid, uint256 tokenId)` (already emitted on both mint and update, `contracts/car_nft_sc.sol:74`) is the data source; nothing about it changes.

## Interfaces with Frontend

- New env vars: `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` (Sepolia) / `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL` (localhost/Hardhat) — optional, consumed by the paired frontend plan's `getContractDeployBlock(chainId)` helper as the `fromBlock` for its `CidStored` event query.
- No ABI change.

## Testing

- Run `npm run deploy:local`; confirm `deployments/localhost.json` contains a `deployedAtBlock` field and `frontend/.env.local` gets `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL` set to the same value.
- Run `npm run deploy:sepolia` (only if/when a redeploy is otherwise warranted — not required just for this feature); confirm the same for the Sepolia key, and that `docs/deployments/sepolia_contract_deploy_addresses_<date>.md` includes the block number.
- Note: the **currently live** Sepolia deployment (`deployments/sepolia.json`, deployed before this plan) won't retroactively have `deployedAtBlock`. The frontend must treat the env var as optional and fall back to `fromBlock: 0` for it (covered in the paired frontend plan) — no redeploy is required to ship this feature against the existing contract.

## Deployment and Migration

- No migration — purely additive to the deploy script's own output. Does not require redeploying `VinCidRegistry`/`CarRewardToken` themselves; the new field only appears starting with the *next* deploy run on any network.

## Risks and Rollback

- Risk: none to contract state — script-only change.
- Rollback: remove the added lines from `scripts/deploy.js`; frontend already tolerates the var being absent.

## Open Questions

None.
