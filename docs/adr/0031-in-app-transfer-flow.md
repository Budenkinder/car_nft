# ADR 0031: In-app wallet-to-wallet ownership transfer

- **Status:** proposed
- **Date:** 2026-07-31
- **Scope:** both
- **Related plans:**
  - `docs/plans/draft/0031-in-app-transfer-flow-frontend.md`
  - `docs/plans/draft/0031-in-app-transfer-flow-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-31-006-simple-transfer-flow-chosen.md`

## Context

The user's wishlist asked for "in-app transfer flow for selling the car — new owner just needs a wallet address, no paperwork." `VinCidRegistry` already inherits `ERC721URIStorageUpgradeable`, which already provides `safeTransferFrom(from, to, tokenId)`/`transferFrom` and standard approval machinery — nothing in the frontend surfaces any of it today. This ADR covers only the simple, trust-required case (seller directly transfers to a buyer's address, no payment coupled to the transfer). The payment-coupled, trust-minimized case (atomic NFT-for-ETH swap, listings) is a separate, materially riskier concern covered by ADR 0032.

## Decision

Add a "Transfer ownership" action to the main app's loaded-VIN view, visible only when the connected wallet is the VIN's current NFT owner (checked via `ownerOf`), that collects a recipient address and calls `safeTransferFrom(currentOwner, recipient, tokenId)` directly. No contract change: `VinCidRegistry` already exposes everything needed, and the resulting `Transfer` event feeds directly into ADR 0029's ownership-history reconstruction with no additional wiring.

## Options Considered

### Option A — Call existing `safeTransferFrom` directly from the frontend (chosen)
- **Pros:** Zero contract change, zero new risk surface, ships immediately; the transfer is atomic at the NFT level (either it fully succeeds or fully reverts) even without any payment coupling; every transfer is automatically visible in ADR 0029's ownership history with no extra work.
- **Cons:** No payment guarantee — the seller must trust the buyer to pay by some other means (cash, bank transfer) before or after transferring, or vice versa. This is the same trust model as handing over a paper title today, not an improvement on the payment side — that gap is exactly what ADR 0032's escrow addresses.

### Option B — Add a custom `transferOwnership(vin, to)` wrapper function to `VinCidRegistry` instead of calling the inherited ERC-721 function directly
- **Pros:** Could add VIN-specific side effects at transfer time (e.g. auto-clearing something, emitting a VIN-specific event instead of just the generic `Transfer`).
- **Cons:** No such side effect is needed today; a wrapper adds contract surface and gas cost for no behavioral gain over calling `safeTransferFrom` directly, and risks subtly diverging from standard ERC-721 semantics that wallets/explorers/marketplaces already understand. Rejected — nothing here justifies deviating from the standard.

## Consequences

- **Positive:** Sellers can transfer a car NFT to a buyer's wallet address with no new contract deployment, no new risk, and full continuity with the existing standard ERC-721 tooling (Etherscan, wallets, block explorers already understand plain transfers).
- **Negative / accepted costs:** No payment guarantee is provided by this feature alone — sellers and buyers must still coordinate payment out-of-band, same as today's paper-title process. This is explicitly deferred to ADR 0032, not silently assumed to be solved here.
- **Frontend impact:** New transfer form/action in the loaded-VIN view; new contract-call function.
- **Contracts impact:** None.
- **Follow-ups:** ADR 0032 (escrow-style atomic sale) removes the payment-trust gap this ADR leaves open, for users who want it.

## References

- `contracts/car_nft_sc.sol` — inherited `ERC721URIStorageUpgradeable` providing `safeTransferFrom`/`transferFrom`/`ownerOf` unchanged.
- `docs/adr/0029-ownership-history-public-lookup.md` — the `Transfer` event this feature emits is exactly what that ADR's ownership-history reconstruction already consumes.
