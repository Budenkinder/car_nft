# Plan 0027 — NFT transaction provenance link — Frontend

- **ADR:** `docs/adr/0027-nft-transaction-provenance-link.md`
- **Paired plan:** `docs/plans/draft/0027-nft-transaction-provenance-link-contracts.md`
- **Status:** draft
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a per-VIN transaction history, reconstructed from past `CidStored` events, and surface it (Etherscan-linked) wherever a VIN's record is shown: after loading an existing VIN, and right after a fresh successful registration. Out of scope: adding a per-row history to "Show All Registered NFTs" (would need one event query per listed VIN — deferred as a follow-up, see Open Questions); any contract change (handled, as a no-op, by the paired contracts plan aside from the deploy-block sync it depends on).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/utils/contract_utils.js` | modify | Add a `getContractDeployBlock(chainId)` helper reading the new `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK(_LOCAL)` env vars, falling back to `0` if unset or unparsable. |
| `frontend/src/utils/pinata_ipfs_nft_service.js` | modify | Add `getTransactionHistoryForVin(vin, chainId)`. |
| `frontend/src/App.js` | modify | Call the new function after a successful "Load Car NFT" and after a successful registration; render a "Transaction History" list. |

## Tasks

- [ ] **1.** In `frontend/src/utils/contract_utils.js`, add `getContractDeployBlock(chainId)`, mirroring `getContractAddress`'s structure: a small map from chainId to `process.env.REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` (Sepolia) / `..._LOCAL` (Hardhat localhost), `parseInt`'d, defaulting to `0` when unset/`NaN` (covers the currently-live Sepolia deployment, which predates this feature).
- [ ] **2.** In `frontend/src/utils/pinata_ipfs_nft_service.js`, add `getTransactionHistoryForVin(vin, chainId)`: build the `web3`/contract instance the same way `getCidFromContract` does (current lines 39-61), call `contract.getPastEvents("CidStored", { fromBlock: getContractDeployBlock(chainId), toBlock: "latest" })`, filter results to `returnValues.vin === vin`, map each to `{ cid: returnValues.cid, txHash: event.transactionHash, blockNumber: Number(event.blockNumber) }`, sort ascending by `blockNumber`, and return the array (empty on error, logged via `netLog` per this file's existing conventions).
- [ ] **3.** In `frontend/src/App.js`, add a `txHistory` state (`useState([])`). In `handleLoadNFT`'s success path (after a CID is found, current lines 200-218), call `getTransactionHistoryForVin(vin, chainId)` and `setTxHistory(...)` with the result.
- [ ] **4.** In `handleSubmit`'s success branch (current lines 166-168), after `setTxHash(result.txHash)`, call `getTransactionHistoryForVin(createVin, chainId)` and `setTxHistory(...)` too, so a freshly-registered/updated VIN shows the same history list immediately rather than only the single transient banner.
- [ ] **5.** Render `txHistory` as a small list near the loaded/registered car's details: each row shows block number, an Etherscan link (`https://sepolia.etherscan.io/tx/${txHash}` — reuse the existing pattern from the success banner, current line ~477) and a label — `"Registration"` for the first (lowest-block) entry, `"Update"` for the rest. Hide the section entirely when `txHistory` is empty.

## Interfaces with Contracts

- Reads: `contract.getPastEvents("CidStored", { fromBlock, toBlock: "latest" })` against the existing `CidStored(string vin, string cid, uint256 tokenId)` event (`contracts/car_nft_sc.sol:74`) — no ABI change needed, this event is already emitted today.
- New env inputs: `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` / `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL`, written by the paired contracts plan's `scripts/deploy.js` change (optional — defaults to `0`/full scan when absent, which covers the current live Sepolia deployment).

## Testing

- No existing automated frontend tests cover this area; none added here, consistent with this repo's manual-verification approach for UI/wallet flows (see `docs/memory/frontend/`).
- Manual verification: (a) register a new VIN — confirm the history list shows exactly one "Registration" entry whose tx hash matches the existing success banner. (b) Load that same VIN later via "Load Car NFT" — confirm the same single entry reappears. (c) Submit an update to it — confirm the history now shows two entries, oldest (Registration) first, newest (Update) second, both linking to the correct Etherscan pages.
- Run once against a local Hardhat deploy (after the paired contracts plan's `deployedAtBlock` sync) and once against Sepolia (exercising the `fromBlock: 0` fallback, since the live contract predates that field) to confirm both code paths work.

## Risks and Rollback

- Risk: on Sepolia, scanning from block `0` (fallback case) could be slow or hit an RPC provider's block-range/page-size limit as the chain grows — acceptable for now given POC-scale usage; flagged as a reason to eventually redeploy with the block-sync feature in place (at which point `fromBlock` becomes tight and this risk goes away for future VINs).
- Rollback: remove the new state/calls/UI block; the added `contract_utils.js`/`pinata_ipfs_nft_service.js` functions are additive and inert if unused.

## Open Questions

- Should "Show All Registered NFTs" also show a transaction link per row (e.g. the latest one)? Would require one extra event query per row (or a single full-range query shared across all rows, filtered per VIN client-side) — deferred here to keep this plan's scope to the two places the user specifically pointed at (loading a VIN, and right after registering one). Worth a follow-up if wanted.
