# Plan 0032 — Escrow-style atomic sale + marketplace — Contracts

- **ADR:** `docs/adr/0032-escrow-marketplace.md`
- **Paired plan:** `docs/plans/draft/0032-escrow-marketplace-frontend.md`
- **GitHub Issue:** [#38](https://github.com/Budenkinder/car_nft/issues/38)
- **Status:** draft
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a new, standalone, non-upgradeable `CarSaleEscrow` contract handling listing, atomic NFT-for-ETH sale, cancellation, and pull-payment withdrawal. `VinCidRegistry` is unmodified — sellers use its existing standard `approve`. Out of scope: any bid/auction mechanism, any ERC-20 payment option (ETH only for v1), any upgrade path for the escrow contract itself (deliberately non-upgradeable per ADR 0032).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `contracts/CarSaleEscrow.sol` | add | New standalone contract. Imports `IERC721` (for `ownerOf`/`getApproved`/`safeTransferFrom` calls against the deployed `VinCidRegistry`) and OpenZeppelin's `ReentrancyGuard`. |
| `scripts/deployEscrow.js` | add | One-time deploy script for `CarSaleEscrow`, taking the already-deployed `VinCidRegistry` proxy address as a constructor argument. Writes `escrow` address into `deployments/<network>.json` alongside `registry`/`implementation`. Syncs ABI + address to the frontend, following the existing `deployUtils.js` helpers from ADR 0028. |
| `test/CarSaleEscrow.test.js` | add | Full listing/buy/cancel/withdraw suite, including adversarial cases (non-owner listing, stale listing after out-of-band transfer, wrong `msg.value`, reentrancy attempt, double-withdraw). |
| `test/fixtures.js` | modify | Add a fixture deploying `VinCidRegistry` (proxy) + `CarSaleEscrow` together for the new test suite. |

## Tasks

- [ ] **1.** Write `contracts/CarSaleEscrow.sol`: constructor takes the `VinCidRegistry` address; `struct Listing { address seller; uint256 tokenId; uint256 price; bool active; }`; `mapping(string => Listing) public listings`; `mapping(address => uint256) public pendingWithdrawals`; `string[] private listedVins`.
- [ ] **2.** Implement `list(string vin, uint256 price)`: requires `msg.sender == VinCidRegistry.ownerOf(tokenId)`, `price > 0`, and `VinCidRegistry.getApproved(tokenId) == address(this)`; stores the listing; emits `Listed(vin, seller, price)`.
- [ ] **3.** Implement `buy(string vin) external payable nonReentrant`: requires an active listing, `msg.value == listing.price` exactly, re-verifies current `ownerOf`/`getApproved` (auto-invalidating and reverting on a stale listing rather than silently succeeding against wrong state), calls `safeTransferFrom(seller, buyer, tokenId)`, credits `pendingWithdrawals[seller] += msg.value`, marks the listing inactive, emits `Sold(vin, seller, buyer, price)`.
- [ ] **4.** Implement `cancelListing(string vin)`: requires `msg.sender == listing.seller`, marks inactive, emits `ListingCancelled(vin, seller)`.
- [ ] **5.** Implement `withdraw() external nonReentrant`: pays out `pendingWithdrawals[msg.sender]` via a checked low-level call (same non-standard-token-safe pattern already used in `VinCidRegistry.withdrawToken`, adapted for ETH), zeroing the balance before the external call (checks-effects-interactions).
- [ ] **6.** Implement `getActiveListings() external view returns (string[] memory vins, Listing[] memory listingsOut)`, filtering `listedVins` down to currently-active entries.
- [ ] **7.** Write `scripts/deployEscrow.js`.
- [ ] **8.** Write `test/CarSaleEscrow.test.js` covering the full happy path and every adversarial case listed in Testing below.
- [ ] **9.** Deploy locally (`hardhat run scripts/deployEscrow.js --network localhost`), exercise list → buy → withdraw end-to-end against a real `VinCidRegistry` proxy, confirm the NFT and ETH both move exactly once.

## Contract Surface

- **New contract:** `CarSaleEscrow` (non-upgradeable, plain constructor taking the `VinCidRegistry` address).
- **New functions:** `list(string, uint256)`, `buy(string) payable`, `cancelListing(string)`, `withdraw()`, `getActiveListings() view`.
- **New events:** `Listed(string vin, address indexed seller, uint256 price)`, `Sold(string vin, address indexed seller, address indexed buyer, uint256 price)`, `ListingCancelled(string vin, address indexed seller)`.
- **Access control:** `list`/`cancelListing` require the caller to be the listing's seller (verified against `VinCidRegistry.ownerOf` at list time); `buy` is open to any address with sufficient `msg.value`; `withdraw` pays only the caller's own accrued balance.
- **Gas considerations:** `buy` does two external calls (`safeTransferFrom` to the registry, no push-payment to the seller) — bounded, predictable cost; `withdraw` is a separate transaction paid by the seller, not bundled into `buy`, keeping `buy`'s gas cost independent of the seller's ability to receive ETH.

## Interfaces with Frontend

- ABI: new `CarSaleEscrow` ABI exported to `frontend/src/utils/car_sale_escrow_abi.json` (separate file from the registry's ABI, since it's a separate contract) by `scripts/deployEscrow.js`.
- Address: new `REACT_APP_ESCROW_CONTRACT_ADDRESS`/`_LOCAL` env vars, written by `scripts/deployEscrow.js` following the existing `upsertEnvVar` helper from ADR 0028.
- Events: `Listed`/`Sold`/`ListingCancelled` drive the marketplace UI's live listing state.

## Testing

- `test/CarSaleEscrow.test.js`: happy path (list → buy → withdraw); non-owner cannot list; cannot list without prior `approve`; cannot buy with wrong `msg.value` (both over and under); cannot buy an inactive/already-sold/cancelled listing; a listing becomes unbuyable (reverts, does not silently misbehave) if the seller transferred the NFT out-of-band after listing; reentrancy attempt via a malicious buyer/seller contract fails against `nonReentrant`; double-withdraw pays zero the second time; `getActiveListings` excludes sold/cancelled listings.
- Security checks: `nonReentrant` on both `buy` and `withdraw`; checks-effects-interactions ordering (state updated before any external call); no direct ETH push to an arbitrary address anywhere in the contract.
- Local integration: full list → buy → withdraw cycle against a real deployed `VinCidRegistry` proxy and `CarSaleEscrow` on a Hardhat `localhost` node, confirmed via the frontend once the paired frontend plan ships.

## Deployment and Migration

- One-time deploy via `scripts/deployEscrow.js`, taking the already-bootstrapped `VinCidRegistry` proxy address as input. Independent of `VinCidRegistry`'s own deploy/upgrade lifecycle.
- No upgrade path (deliberately non-upgradeable, ADR 0032). A future fix redeploys a new `CarSaleEscrow` and requires sellers to re-list (re-`approve` + `list`) against the new address.
- Network sequence: `localhost` first, then Sepolia, mirroring ADR 0028's pattern.
- Verification on Etherscan: verify `CarSaleEscrow`'s source after deploy.

## Risks and Rollback

- Risk: this is the only contract in the system holding user funds in flight — the highest-severity risk surface in this entire roadmap. Mitigated by pull-payment, `nonReentrant`, exact-`msg.value` matching (no complex refund logic to get wrong), and non-upgradeability (smaller trusted surface, no upgrade-key risk).
- Risk: a stale listing (seller transferred/revoked approval without cancelling) must fail safely — mitigated by re-checking `ownerOf`/`getApproved` inside `buy` itself, not just at `list` time.
- Rollback: no in-place rollback mechanism (non-upgradeable by design) — a compromised or buggy `CarSaleEscrow` is retired by no longer directing frontend traffic to it and deploying a fresh replacement; any ETH already pulled via `withdraw` prior to discovery is not recoverable by this contract (standard risk of any funds-custody contract, called out here explicitly).

## Open Questions

- Should `CarSaleEscrow` support an owner-controlled emergency pause (e.g. OpenZeppelin's `Pausable`) given it holds funds, even though it's non-upgradeable? Not committed — would need its own access-control decision (who can pause) and is a meaningful scope addition; flagged for the user to weigh in on before this plan is approved.
