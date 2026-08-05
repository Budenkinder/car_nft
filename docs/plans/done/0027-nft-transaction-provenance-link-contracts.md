# Plan 0027 — NFT transaction provenance link — Contracts

- **ADR:** `docs/adr/0027-nft-transaction-provenance-link.md`
- **Paired plan:** `docs/plans/done/0027-nft-transaction-provenance-link-frontend.md`
- **GitHub Issue:** [#42](https://github.com/Budenkinder/car_nft/issues/42)
- **Status:** done
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No Solidity changes (ADR 0027 Option A — `CidStored` already carries everything needed via its transaction receipt). The only change is to `scripts/deploy.js`: record the registry's deployment block number so the frontend can bound its `CidStored` event scan with `fromBlock` instead of scanning from genesis. Out of scope: adding `indexed` fields to any event (ADR 0027 Option B, explicitly deferred); any change to `contracts/car_nft_sc.sol` or `contracts/car_reward_token.sol`.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `scripts/deploy.js` | modify | Capture `registry`'s deployment block number; add `deployedAtBlock` to the `artifact` object (written to `deployments/<network>.json`); sync a new env var into `frontend/.env.local`; include the block number in the Sepolia deploy log markdown. |
| `frontend/.env.example` | modify | Document the two new optional env vars. |
| `deployments/sepolia.json`, `docs/deployments/sepolia_contract_deploy_addresses_2026-07-28.md`, `frontend/.env.local` | modify (unplanned, added mid-implementation) | Backfilled `deployedAtBlock: 11371335` for the already-live Sepolia deployment — see task 6 and `docs/decisions/2026-07-29-010-backfill-sepolia-deployed-at-block.md`. |

## Tasks

- [x] **1.** In `scripts/deploy.js`, after `await registry.waitForDeployment()`, capture the deployment block number via `registry.deploymentTransaction().blockNumber ?? (await deployTx.wait()).blockNumber`. Verified live against Hardhat 3/ethers v6: `deploymentTransaction().blockNumber` was `null` at that point (response captured at broadcast time), so the `.wait()` fallback path is what actually resolves it — confirmed via a real `npm run deploy:local` run (`deployedAtBlock: 2`).
- [x] **2.** Added `deployedAtBlock` to the `artifact` object, written into `deployments/<network>.json`. Verified: `deployments/localhost.json` now contains `"deployedAtBlock": 2` from the same test run.
- [x] **3.** In the "Frontend wiring" section, sync the block number the same way the address is synced: `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL` for `localhost`/`hardhat`, `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` for `sepolia`, via the existing `upsertEnvVar` helper. Sepolia's "also set in Vercel" console block now prints `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` too. Verified: the local run wrote `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL=2` into `frontend/.env.local`.
- [x] **4.** Added `deployedAtBlock` as a row ("Deployed at block") in the Sepolia deploy log markdown template. Not exercised by a live run (no Sepolia redeploy performed or required for this feature, per this plan's own Testing note); verified by code review against the already-tested `artifact.deployedAtBlock` field it reads.
- [x] **5.** Added `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` and `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL` to `frontend/.env.example` with a comment.
- [x] **6.** *(Unplanned — added mid-implementation after a real error surfaced against live Sepolia.)* The `fromBlock: 0` fallback this plan's Testing section assumed would be adequate for the pre-existing Sepolia deployment turned out to be impractical: it requires ~1,138 sequential `eth_getLogs` calls at Sepolia's current block height, which failed against the RPC provider partway through (see paired frontend plan's task 2 deviation note and the linked decision log). Backfilled the real value instead, without a redeploy: binary-searched `eth_getCode` at the live registry address (`0x089711b304ad2E279843588F7051AFe59797CdB8`) to find its exact deployment block, `11371335`, in ~24 RPC calls — then verified `CidStored` events query correctly from that block (161ms, correct VIN/block match against the user's original error). Added `deployedAtBlock: 11371335` to `deployments/sepolia.json` and a matching line in `docs/deployments/sepolia_contract_deploy_addresses_2026-07-28.md`, and set `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK=11371335` in `frontend/.env.local`. **Done:** the user has set `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK=11371335` in Vercel's Production environment variables. Note Production tracks `main`, and this implementation is on `dev` — the variable is in place but won't take effect against this code until `dev` is merged to `main` and a redeploy runs.

## Contract Surface

Unchanged — no new/changed functions or events. `CidStored(string vin, string cid, uint256 tokenId)` (already emitted on both mint and update, `contracts/car_nft_sc.sol:74`) is the data source; nothing about it changes.

## Interfaces with Frontend

- New env vars: `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` (Sepolia) / `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL` (localhost/Hardhat) — optional, consumed by the paired frontend plan's `getContractDeployBlock(chainId)` helper as the `fromBlock` for its `CidStored` event query.
- No ABI change.

## Testing

- **Done:** ran `npm run deploy:local` against a fresh local Hardhat node; confirmed `deployments/localhost.json` contains `deployedAtBlock` and `frontend/.env.local` got `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL` set to the same value.
- Not run: `npm run deploy:sepolia` (only if/when a redeploy is otherwise warranted — not required just for this feature).
- ~~Note: the currently live Sepolia deployment won't retroactively have `deployedAtBlock`; the frontend falls back to `fromBlock: 0`~~ — **superseded, see task 6.** That fallback was tested against the real chain and found impractical (RPC rate limit hit during a ~1,138-call full scan), so the value was backfilled directly instead of relying on the fallback.

## Deployment and Migration

- No migration — purely additive to the deploy script's own output. Does not require redeploying `VinCidRegistry`/`CarRewardToken` themselves; the new field only appears starting with the *next* deploy run on any network.

## Risks and Rollback

- Risk: none to contract state — script-only change plus a metadata-only backfill (a block number, not a code or state change) for the live Sepolia deployment.
- Rollback: remove the added lines from `scripts/deploy.js`; frontend already tolerates the var being absent. To roll back the backfill specifically: remove `deployedAtBlock` from `deployments/sepolia.json` and `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` from `.env.local`/Vercel — the frontend's `0` fallback resumes (with the now-fixed chunking, it will work, just via many more RPC calls).

## Open Questions

None.
