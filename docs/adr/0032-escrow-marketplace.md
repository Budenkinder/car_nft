# ADR 0032: Escrow-style atomic sale and a marketplace listing view

- **Status:** proposed
- **Date:** 2026-07-31
- **Scope:** both
- **Related plans:**
  - `docs/plans/draft/0032-escrow-marketplace-frontend.md`
  - `docs/plans/draft/0032-escrow-marketplace-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-31-007-escrow-marketplace-chosen.md`

## Context

ADR 0031 covers a direct, trust-required transfer with no payment coupling. The user's wishlist also asked for "escrow-style transfer (NFT + payment swap atomically) so buyer and seller don't have to trust each other" and a "listing/marketplace view." This requires a new contract holding both sides of a trade in flight — the highest-risk piece of this whole roadmap, since it custodies real ETH between listing and settlement.

`VinCidRegistry` has no marketplace concerns today. `CarRewardToken` (ADR 0028) established a precedent worth following: keep a narrowly-scoped concern in its own contract rather than growing the core registry.

## Decision

Add a new, standalone, **non-upgradeable** contract, `CarSaleEscrow`:

- **Listing:** seller calls `VinCidRegistry.approve(escrowAddress, tokenId)` (standard ERC-721 approval, no registry change), then `CarSaleEscrow.list(vin, priceWei)`. Stores `Listing { seller, tokenId, price, active }`.
- **Buying:** buyer calls `buy(vin)` with `msg.value == price` exactly (no partial-refund logic — reject anything else outright). The contract re-checks `VinCidRegistry.ownerOf(tokenId) == listing.seller` and `getApproved(tokenId) == address(this)` at call time (handles a seller who transferred or revoked approval out-of-band since listing), then calls `safeTransferFrom(seller, buyer, tokenId)` and credits `pendingWithdrawals[seller] += msg.value` — **pull payment**, not a direct push, so a seller address that can't receive ETH (e.g. a misbehaving contract wallet) can never block or be exploited via the transfer-then-pay step. Marks the listing inactive.
- **Cancelling:** seller calls `cancelListing(vin)` at any time before a sale.
- **Withdrawing:** seller calls `withdraw()` to pull their accumulated proceeds.
- Kept **non-upgradeable**, unlike `VinCidRegistry` (ADR 0028): a contract holding funds in flight is exactly where upgrade authority is most security-sensitive, and this project's UUPS pattern has no timelock/multisig on `owner()` (a single EOA today). A bug fix ships as a fresh `CarSaleEscrow` deployment — same disposable-and-replaceable model already used for `CarRewardToken` — rather than adding upgrade risk to a funds-custody contract.
- Marketplace view: a new `/marketplace` route (using ADR 0029's router) reading all active listings via a `getActiveListings()` view (mirroring `VinCidRegistry.getAllVins()`'s array-of-keys pattern) and rendering a buy button per listing.

## Options Considered

### Option A — Standalone `CarSaleEscrow` contract, non-upgradeable, pull-payment (chosen)
- **Pros:** Clean separation of concerns (mirrors the `CarRewardToken` precedent); pull-payment avoids reentrancy and stuck-funds footguns from pushing ETH directly to an arbitrary seller address; non-upgradeable minimizes the attack surface on the one contract in this system that custodies funds; a bug is fixed by redeploying, not by trusting an upgrade key mid-flight with user funds sitting in it.
- **Cons:** A redeploy after a bug means every active listing must be re-created (re-approve + re-list) on the new contract — more disruptive than an in-place upgrade, but an acceptable, explicit trade-off given the funds-custody concern.

### Option B — Build escrow/listing logic directly into `VinCidRegistry`
- **Pros:** One contract, one deployment, listings automatically inherit the existing UUPS upgrade path.
- **Cons:** Mixes "identity/vehicle-record registry" concerns with "marketplace" concerns in a single upgradeable contract; grows the audit surface of the contract every other feature in this roadmap also depends on; puts fund-custody state inside a contract whose upgrade authority is a single `owner()` EOA with no additional safeguards — the exact opposite of minimizing risk around held funds. Rejected.

### Option C — Direct push payment to the seller (`payable(seller).call{value: price}("")`) instead of pull-payment
- **Pros:** Simpler; buyer sees the sale fully settle (NFT + payment both moved) in one transaction with no separate withdraw step for the seller.
- **Cons:** Classic reentrancy/griefing surface if not carefully ordered, and a seller that is a contract without a payable fallback (or one that deliberately reverts) can block the entire `buy()` call, potentially stranding the buyer's transaction or, worse, being used to grief specific buyers. Pull-payment is the standard, safer pattern for exactly this reason. Rejected.

## Consequences

- **Positive:** Buyers and sellers get an atomic, trust-minimized swap with no need for either party to trust the other — directly answers the wishlist's stated goal. Non-upgradeable + pull-payment keeps the funds-custody surface as small and well-understood as possible.
- **Negative / accepted costs:** A future bug fix requires redeployment and re-listing, not a seamless upgrade. Buyers must send `msg.value` exactly equal to the listed price (no overpay/underpay tolerance) — simplest and safest, but slightly less forgiving UX than a refund-the-difference design; flagged as an explicit, deliberate simplification for v1.
- **Frontend impact:** New `/marketplace` route and listing UI; new "List for sale" / "Buy" actions; new "Withdraw proceeds" action for sellers.
- **Contracts impact:** New standalone contract; `VinCidRegistry` itself is untouched (sellers use its existing standard `approve`).
- **Follow-ups:** If usage grows past what a single-owner, single-deployment escrow model comfortably supports, a v2 with a timelocked/multisig-governed upgrade path would be its own ADR — not adopted now as disproportionate to this project's current scale.

## References

- `docs/adr/0028-vin-registry-uups-proxy.md` — the `CarRewardToken`-stays-separate precedent this follows for `CarSaleEscrow`.
- `docs/adr/0029-ownership-history-public-lookup.md` — the router this ADR's `/marketplace` route reuses.
- `docs/adr/0031-in-app-transfer-flow.md` — the trust-required alternative this ADR removes the payment-trust gap from, for users who want that guarantee.
- OpenZeppelin's `ReentrancyGuard` / pull-payment pattern guidance — informs the `withdraw()` design, to be pulled in as a dependency during implementation rather than hand-rolled.
