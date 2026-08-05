# Plan 0032 — Escrow-style atomic sale + marketplace — Frontend

- **ADR:** `docs/adr/0032-escrow-marketplace.md`
- **Paired plan:** `docs/plans/draft/0032-escrow-marketplace-contracts.md`
- **GitHub Issue:** [#38](https://github.com/Budenkinder/car_nft/issues/38)
- **Status:** draft
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add "List for sale" / "Buy" / "Withdraw proceeds" actions and a `/marketplace` browse page (reusing ADR 0029's router). Depends on the paired contracts plan shipping `CarSaleEscrow` first. Out of scope: any bid/auction UI, any non-ETH payment option.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/utils/escrow_service.js` | add | New file (separate from `pinata_ipfs_nft_service.js`, since this talks to a different contract/ABI): `approveEscrow`, `listForSale`, `buyListing`, `cancelListing`, `withdrawProceeds`, `getActiveListings`. Reads `REACT_APP_ESCROW_CONTRACT_ADDRESS` via a new `contract_utils.js` helper mirroring the existing registry-address resolution. |
| `frontend/src/utils/contract_utils.js` | modify | Add `getEscrowContractAddress(chainId)`, mirroring the existing `getContractAddress`. |
| `frontend/src/pages/MarketplacePage.js` | add | Lists all active listings (`getActiveListings`), each with VIN, price, a link into ADR 0029's public lookup page for that VIN, and a "Buy" button. |
| `frontend/src/components/ListForSaleForm.js` | add | Shown in the loaded-VIN view when the connected wallet owns it: price input, calls `approveEscrow` then `listForSale` (two sequential transactions — approval is a distinct on-chain step the user must confirm separately, cannot be bundled). |
| `frontend/src/components/SellerProceeds.js` | add | Shown to a connected wallet with a nonzero pending balance in `CarSaleEscrow`: displays the amount and a "Withdraw" button. |
| `frontend/src/App.js` | modify | Add a `/marketplace` route; render `ListForSaleForm` in the loaded-VIN view. |

## Tasks

- [ ] **1.** Add `getEscrowContractAddress` to `contract_utils.js`.
- [ ] **2.** Add `frontend/src/utils/escrow_service.js` with all six functions, following the existing gas-estimate/send/receipt/`txLog` pattern.
- [ ] **3.** Add `ListForSaleForm.js`: price input (ETH, converted to wei), two-step approve-then-list flow with clear UI state for "approval pending" vs "listing pending" so the two separate transactions aren't confusing.
- [ ] **4.** Add `MarketplacePage.js`: fetch and render active listings, "Buy" button sends exact `price` as `msg.value`.
- [ ] **5.** Add `SellerProceeds.js`: poll/read the connected wallet's `pendingWithdrawals` balance, render a withdraw button when nonzero.
- [ ] **6.** Wire the new route and components into `App.js`/the router from ADR 0029.
- [ ] **7.** After a successful `buy`, refresh the marketplace listing state and (if applicable) ADR 0029's ownership history for that VIN.

## Interfaces with Contracts

- Functions called: `CarSaleEscrow.list`, `.buy`, `.cancelListing`, `.withdraw`, `.getActiveListings`; `VinCidRegistry.approve` (existing standard ERC-721 function, not previously used by this frontend).
- Events consumed: `Listed`, `Sold`, `ListingCancelled` — drive `MarketplacePage`'s live state; `Sold`/`Transfer` also refresh ownership history.
- ABI / address handoff: new `car_sale_escrow_abi.json` and `REACT_APP_ESCROW_CONTRACT_ADDRESS`/`_LOCAL`, from the paired contracts plan's `scripts/deployEscrow.js`.
- Network assumptions: unchanged.

## Testing

- No new unit tests (matches project convention).
- Manual verification: list a VIN for sale from wallet A; confirm it appears on `/marketplace`; buy it from wallet B with the exact price; confirm the NFT now shows wallet B as owner (ADR 0029), the listing disappears from `/marketplace`, and wallet A can withdraw the proceeds via `SellerProceeds`. Separately: confirm sending the wrong ETH amount is rejected client-side before even prompting a transaction (in addition to the contract-level revert).
- How to verify against local Hardhat: after the paired contracts plan's local `CarSaleEscrow` deploy, exercise list → buy → withdraw through the actual UI with two separate test wallets.

## Risks and Rollback

- Risk: the two-step approve-then-list flow is a common source of user confusion in NFT marketplace UIs generally — mitigate with explicit step-by-step UI state (not just a spinner) so the user understands two separate wallet confirmations are expected.
- Risk: since `buy` requires exact `msg.value`, a stale displayed price (e.g. another tab bought it first) must fail gracefully with a clear "this listing is no longer available" message, not a cryptic revert.
- Rollback: additive UI/route; removing it fully reverts to pre-0032 behavior with no data impact on `VinCidRegistry`.

## Open Questions

- Should the marketplace page show a price in ETH only, or also a fiat-equivalent estimate (would require a new price-feed dependency)? Not committed — ETH-only for v1 unless the user wants otherwise.
