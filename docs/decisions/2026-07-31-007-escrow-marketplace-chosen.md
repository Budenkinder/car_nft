---
date: 2026-07-31
scope: both
status: proposed
related_adr: 0032-escrow-marketplace
supersedes: none
---

# Standalone, non-upgradeable `CarSaleEscrow` with pull-payment, over building marketplace logic into `VinCidRegistry` or pushing payment directly to the seller

## Context

The wishlist asked for an atomic NFT/payment swap and a listings view. This is the highest fund-custody-risk piece of the whole roadmap derived from that wishlist, so the contract-design choices here get more scrutiny than the other four feature ADRs drafted alongside it.

## Decision

Add a new, standalone, deliberately **non-upgradeable** `CarSaleEscrow` contract (mirroring the `CarRewardToken`-stays-separate precedent from ADR 0028) using a **pull-payment** withdrawal pattern rather than pushing ETH directly to the seller inside `buy()`.

## Alternatives Considered

- Build listing/escrow logic into `VinCidRegistry` itself — rejected; would put fund-custody state inside the one contract every other feature in this roadmap depends on, upgradeable by a single-EOA `owner()` with no additional safeguard — the opposite of minimizing risk around held funds.
- Direct push payment to the seller inside `buy()` — rejected; standard reentrancy/griefing surface (a seller contract without a payable fallback, or one that deliberately reverts, could block the whole call). Pull-payment is the safer, standard pattern for exactly this reason.
- Make `CarSaleEscrow` UUPS-upgradeable like `VinCidRegistry` — rejected; a contract holding funds in flight is exactly where upgrade authority is most security-sensitive, and this project's upgrade key today is a single EOA with no timelock/multisig. A bug fix ships as a fresh deployment instead.

## Consequences

- Buyers/sellers get a trust-minimized atomic swap; `VinCidRegistry` itself stays untouched (sellers use its existing standard `approve`).
- A future bug fix requires redeployment and re-listing (re-approve + re-list) rather than an in-place upgrade — an accepted trade-off given the funds-custody concern.
- `buy()` requires exact `msg.value` (no overpay/underpay refund logic) — simplest and safest for v1, flagged as a deliberate UX simplification.
