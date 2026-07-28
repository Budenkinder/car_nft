# Plan 0004 — List all registered NFTs (VIN → CID) — Frontend

- **ADR:** `docs/adr/0004-frontend-list-all-registered-nfts.md`
- **Paired plan:** `docs/plans/done/0004-frontend-list-all-registered-nfts-contracts.md`
- **Status:** done
- **Date:** 2026-05-21

> Plan files live in a subfolder named after their `Status:` value. New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a read-only "All Registered Car NFTs" section to the React UI that, on demand, calls the registry's `getAllVins()` + `getAllCidsAsList()` view functions and renders every registered NFT as a `VIN → CID` list, each CID linking to the IPFS gateway.

**Out of scope:** pagination/virtualisation of the list; filtering or search within the list; reading per-NFT metadata for the list (the existing single-VIN "Load Car NFT" flow already does that); any contract or ABI change.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/utils/pinata_ipfs_nft_service.js` | modify | Add `getAllRegisteredNfts(chainId)` export. |
| `frontend/src/App.js` | modify | New state (`nftList`, `isLoadingList`), `handleShowAllNfts` handler, new MUI section. |
| `docs/memory/frontend/web3js-contract-access-pattern.md` | add | Memory: frontend uses web3.js (not ethers); all contract calls funnel through `pinata_ipfs_nft_service.js`. |
| `docs/memory/MEMORY.md` | modify | Index line for the new memory file. |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [x] **1.** In `pinata_ipfs_nft_service.js`, add `getAllRegisteredNfts(chainId)`. Mirror the `getMinterAddress` pattern: build `web3` from `window.ethereum`, resolve the address via `getContractAddress(chainId)`, return `[]` if no address. Call `getAllVins()` and `getAllCidsAsList()` via `Promise.all`, zip by index into `[{ vin, cid }]`, and return that array. Wrap in try/catch returning `[]` on failure. Add `netLog.debug`/`info`/`error` calls (`getAllRegisteredNfts:start|done|failed`) consistent with the other service functions.
- [x] **2.** In `App.js`, import `getAllRegisteredNfts`; add state `const [nftList, setNftList] = useState([])` and `const [isLoadingList, setIsLoadingList] = useState(false)`.
- [x] **3.** In `App.js`, add `handleShowAllNfts`: set loading true, log `uiLog.info("showAllNfts:click")`, call `getAllRegisteredNfts(chainId)`, store the result, log the count, set loading false.
- [x] **4.** In `App.js`, add a new `Container`/`Paper` section titled "All Registered Car NFTs", placed directly below the VIN Search section (both are read-only views). Contents: a "Show all registered NFTs" `Button` (disabled when `walletAddress.length === 0` or `isLoadingList`, with the `CircularProgress` start-icon pattern used by "Load Car NFT"); below it, when `nftList.length > 0`, a MUI `List` of rows each showing the VIN and the CID as `<a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank" rel="noreferrer">`; an empty-state `Typography` ("No NFTs registered yet.") shown only after a load has completed and returned zero rows.
- [x] **5.** Create `docs/memory/frontend/web3js-contract-access-pattern.md` and add its index line to `docs/memory/MEMORY.md`.

## Interfaces with Contracts

- Functions called: `VinCidRegistry.getAllVins() -> string[]`, `VinCidRegistry.getAllCidsAsList() -> string[]`. Index `i` of each refers to the same NFT (contract builds both from the same `vinKeys` array — `contracts/car_nft_sc.sol:106-116`).
- Events consumed: none.
- ABI / address handoff: ABI from `frontend/src/utils/contract_abi.json` (both functions already declared); address from `getContractAddress(chainId)` in `contract_utils.js`.
- Network assumptions: hex `chainId` from the `MetaMaskLogin` callback; works on Sepolia (`0xaa36a7`) and Hardhat local (`0x7a69`).

## Testing

- **Local:** deploy to a Hardhat node, mint 2+ NFTs via the existing "Register New Car NFT" flow, click "Show all registered NFTs" → both VIN→CID rows appear; each CID link opens the Pinata gateway.
- **Sepolia:** connect MetaMask to Sepolia, click the button → the registry's existing entries render.
- **Empty registry:** fresh deployment → after clicking, "No NFTs registered yet." shows.
- **Error paths:** button disabled with no wallet connected; on an unconfigured network (`getContractAddress` returns null) the call returns `[]` and a `netLog.warn` is emitted.
- **Loading state:** button shows the spinner while the call is in flight.

## Risks and Rollback

- **Risk:** `getAllVins`/`getAllCidsAsList` are unpaginated; a very large registry could make the call slow or exceed RPC response limits. Acceptable at current scale; pagination is an ADR-0004 follow-up.
- **Risk:** web3.js returns the two arrays independently; correctness of the zip relies on the contract's index alignment (verified in the contract source).
- **Rollback:** purely additive — revert the `App.js` and `pinata_ipfs_nft_service.js` changes; no state, storage, or migration involved.

## Open Questions

- None. List content (VIN→CID pairs), trigger (dedicated button), and CID display (clickable IPFS link) confirmed with the user.
