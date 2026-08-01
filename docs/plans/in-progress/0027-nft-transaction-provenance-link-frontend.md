# Plan 0027 — NFT transaction provenance link — Frontend

- **ADR:** `docs/adr/0027-nft-transaction-provenance-link.md`
- **Paired plan:** `docs/plans/in-progress/0027-nft-transaction-provenance-link-contracts.md`
- **GitHub Issue:** [#42](https://github.com/Budenkinder/car_nft/issues/42)
- **Status:** in-progress
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

- [x] **1.** In `frontend/src/utils/contract_utils.js`, added `getContractDeployBlock(chainId)`, mirroring `getContractAddress`'s structure: a `CONTRACT_DEPLOY_BLOCKS` map keyed by chainId to `process.env.REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` (Sepolia) / `..._LOCAL` (Hardhat localhost), `parseInt`'d, defaulting to `0` when unset/`NaN`.
- [x] **2.** In `frontend/src/utils/pinata_ipfs_nft_service.js`, added `getTransactionHistoryForVin(vin, chainId)` exactly as specified — same web3/contract construction pattern as `getCidFromContract`, `getPastEvents("CidStored", { fromBlock: getContractDeployBlock(chainId), toBlock: "latest" })`, filtered/mapped/sorted, empty array + `netLog.error` on failure.

  **Deviation found after initial implementation, fixed the same session:** testing against the live Sepolia deployment hit a real `Returned error: range 11376833 exceeds limit of 10000` — the RPC provider (a common Infura/Alchemy-tier limit) caps a single `eth_getLogs` call to 10,000 blocks, and the live contract predates `deployedAtBlock` so it was scanning from `0`. Added a `getPastEventsChunked` helper that splits the query into 9,999-block windows so no single call exceeds the cap, regardless of network or how old the deployment is. See `docs/decisions/2026-07-29-010-backfill-sepolia-deployed-at-block.md` for the full root-cause writeup, including why chunking alone wasn't enough (a full 0-to-tip scan is ~1,138 sequential calls, which hit the provider's rate limit) — the live Sepolia deployment's `deployedAtBlock` was also backfilled (see paired contracts plan).
- [x] **3.** In `frontend/src/App.js`, added `txHistory` state and wired it into `handleLoadNFT`'s success path (calls `getTransactionHistoryForVin(vin, chainId)` right after a CID is found).
- [x] **4.** Wired into `handleSubmit`'s success branch too (calls `getTransactionHistoryForVin(createVin, chainId)` right after `setTxHash`, before the new-mint field reset — the `createVin` closure variable is unaffected by the subsequent `setCreateVin("")` call since React state updates don't mutate the current render's local bindings).
- [x] **5.** Rendered `txHistory` as a "Transaction History" `List` inside the "Create or Update CAR NFT" panel (the same panel `handleLoadNFT` already populates for an existing VIN, so one render location covers both the load and post-registration cases): each row shows `Block {blockNumber}` and an Etherscan tx link, labeled `"Registration"` for index 0 and `"Update"` for the rest; the whole block is hidden when `txHistory` is empty.

  **Verification beyond `npm run build` (which compiled cleanly, +510 B gzipped):** ran a real local Hardhat deploy, then a Node script using the same `web3` v4 API against the live chain — called `storeCid` twice for one VIN (mint + update) and ran the exact `getPastEvents`/filter/map/sort logic `getTransactionHistoryForVin` uses. Confirmed: 2 entries returned, correctly ordered (registration at the lower block first, update second), `txHash`/`blockNumber` matching the real transaction receipts exactly. This exercises the core data-reconstruction logic end-to-end against a real chain, though the React rendering itself still needs a real-browser/MetaMask check (see Testing below).

## Interfaces with Contracts

- Reads: `contract.getPastEvents("CidStored", { fromBlock, toBlock: "latest" })` against the existing `CidStored(string vin, string cid, uint256 tokenId)` event (`contracts/car_nft_sc.sol:74`) — no ABI change needed, this event is already emitted today.
- New env inputs: `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` / `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL`, written by the paired contracts plan's `scripts/deploy.js` change on future deploys (optional — defaults to `0`/full scan when absent). The current live Sepolia deployment predates this field; its value (`11371335`) was backfilled by binary-searching `eth_getCode` rather than left to the `0` fallback, since the fallback proved impractical at Sepolia's current block height (see `docs/decisions/2026-07-29-010-backfill-sepolia-deployed-at-block.md`).

## Testing

- No existing automated frontend tests cover this area; none added here, consistent with this repo's manual-verification approach for UI/wallet flows (see `docs/memory/frontend/`).
- **Done (this session):** verified the underlying event-reconstruction logic end-to-end against a real local Hardhat deploy (see task 5's verification note) — confirms `getTransactionHistoryForVin`'s query/filter/sort is correct against actual on-chain events, using the exact `fromBlock: deployedAtBlock` value the paired contracts plan's deploy-script change produces.
- **Done (this session), triggered by a real user-reported error:** the user hit `range 11376833 exceeds limit of 10000` testing VIN `WBADT33383G473810` against live Sepolia. Root-caused and fixed (chunked queries + backfilled `deployedAtBlock`, see task 2's deviation note); re-verified directly against the real Sepolia RPC endpoint (not a local node) using the exact fixed logic — returned the correct single history entry for that VIN, at the exact block number (`11376833`) the original error referenced, in ~161ms.
- **Not completed by the assistant** — requires a real browser + MetaMask, unavailable in this sandbox: (a) register a new VIN in the actual UI — confirm the history list renders exactly one "Registration" entry whose tx hash matches the existing success banner. (b) Load that same VIN later via "Load Car NFT" — confirm the same entry reappears. (c) Submit an update — confirm the history now shows two entries, oldest (Registration) first, newest (Update) second, both linking correctly.
- **Deferred by the user to post-merge (2026-07-29):** the user has set `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK=11371335` in Vercel's Production environment variables (Production tracks `main`; this implementation is on `dev`). Manual verification of (a)-(c) will happen after merging `dev` → `main`, not before. This plan stays `in-progress` until that confirmation lands — do not move to `done` on implementation completeness alone.

## Risks and Rollback

- ~~Risk: on Sepolia, scanning from block `0` (fallback case) could be slow or hit an RPC provider's block-range/page-size limit as the chain grows~~ — **this was hit for real** during this session's testing (see task 2's deviation note), not just a theoretical future risk. Mitigated via chunked queries + a backfilled `deployedAtBlock` for the live deployment. Residual risk: `deployedAtBlock` is fixed forever at `11371335`, so the query range grows ~7,200 blocks/day and will need progressively more chunks over time (not a correctness problem, just more RPC calls) — a redeploy (ADR 0027 Option B) is the eventual escalation path if that becomes slow, not needed now.
- Rollback: remove the new state/calls/UI block; the added `contract_utils.js`/`pinata_ipfs_nft_service.js` functions are additive and inert if unused.

## Open Questions

- Should "Show All Registered NFTs" also show a transaction link per row (e.g. the latest one)? Would require one extra event query per row (or a single full-range query shared across all rows, filtered per VIN client-side) — deferred here to keep this plan's scope to the two places the user specifically pointed at (loading a VIN, and right after registering one). Worth a follow-up if wanted.
