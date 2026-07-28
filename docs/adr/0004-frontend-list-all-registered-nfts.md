# ADR 0004: Frontend — list all registered NFTs (VIN → CID)

- **Status:** accepted
- **Date:** 2026-05-21
- **Scope:** frontend
- **Related plans:**
  - `docs/plans/done/0004-frontend-list-all-registered-nfts-frontend.md`
  - `docs/plans/done/0004-frontend-list-all-registered-nfts-contracts.md`
- **Related decisions:** `docs/decisions/2026-05-21-001-frontend-list-all-registered-nfts.md`

## Context

The `VinCidRegistry` contract already exposes `getAllVins()` and `getAllCidsAsList()` (both `view`, both index-aligned off the same internal `vinKeys` array — see `contracts/car_nft_sc.sol:106-116`), and both are already present in the frontend ABI (`frontend/src/utils/contract_abi.json`). The frontend, however, never calls them: it only does single-VIN lookups via `getCidByVin` and writes via `storeCid`. There is no way in the UI to see every NFT the registry holds. The user wants the frontend to call the registry's list function and render the registered NFTs as a list.

Constraints: the frontend is standardised on **web3.js** (`new Web3(window.ethereum)`, `contract.methods.X().call()`) — not ethers — and funnels all contract access through `frontend/src/utils/pinata_ipfs_nft_service.js`. The UI is Material UI. No contract or ABI change is available or needed.

(Numbering note: `0003` is reserved by the already-approved local-redeploy + ABI-sync plan whose `docs/` files are not yet created; this feature takes `0004`.)

## Decision

Add a read-only "All Registered Car NFTs" section to the frontend. A new service function `getAllRegisteredNfts(chainId)` in `pinata_ipfs_nft_service.js` calls `getAllVins()` and `getAllCidsAsList()` in parallel and zips them by index into `{ vin, cid }` rows. A new MUI section in `App.js` renders these rows on demand behind a dedicated **"Show all registered NFTs"** button; each CID is a clickable link to `https://gateway.pinata.cloud/ipfs/<cid>` (the same gateway `fetchNFTMetadata` already uses).

## Options Considered

### Option A — Dedicated button, VIN→CID pairs, clickable IPFS links *(chosen)*
- **Pros:** No RPC call unless the user asks; each row is self-identifying (VIN) and explorable (CID link); follows the existing service-layer + `getMinterAddress` pattern.
- **Cons:** Two `view` calls instead of one; user must click to see data.

### Option B — `getAllCidsAsList()` only, CIDs displayed as plain text
- **Pros:** Single web3 call; literally "list all CIDs".
- **Cons:** Rows are opaque hash strings with no VIN context and nothing to click; low utility.

### Option C — Auto-load the list on wallet connect
- **Pros:** List always visible; no extra click.
- **Cons:** Forces an unbounded `view` call on every session even when unwanted; both list calls grow with registry size — undesirable as a forced page-load cost.

## Consequences

- **Positive:** Users get a full registry view; the existing `getAllVins`/`getAllCidsAsList` contract surface is finally exercised; change is purely additive.
- **Negative:** `getAllVins()` / `getAllCidsAsList()` are unpaginated — a very large registry could make the call heavy or hit RPC response limits. Acceptable at current testnet scale; flagged as a follow-up.
- **Frontend impact:** New `getAllRegisteredNfts` export in `pinata_ipfs_nft_service.js`; new state, handler, and a third MUI section in `App.js`.
- **Contracts impact:** None. Both functions already exist on the deployed `VinCidRegistry` and in the ABI. No Solidity, script, or ABI change.
- **Follow-ups:** Add pagination (or an indexed/event-based read) if the registry grows large. Record the web3.js-not-ethers service-layer convention in `docs/memory/frontend/`.

## References

- `contracts/car_nft_sc.sol:106-116` — `getAllVins()` / `getAllCidsAsList()`.
- `frontend/src/utils/pinata_ipfs_nft_service.js` — existing service-layer pattern (`getMinterAddress`).
- `frontend/src/utils/contract_abi.json` — ABI already declaring both functions.
