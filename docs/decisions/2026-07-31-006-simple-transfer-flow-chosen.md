---
date: 2026-07-31
scope: both
status: proposed
related_adr: 0031-in-app-transfer-flow
supersedes: none
---

# Call the existing inherited ERC-721 `safeTransferFrom` directly, rather than adding a custom wrapper function

## Context

The wishlist's "in-app transfer flow for selling the car" splits into a simple, trust-required case (this ADR) and a payment-coupled, trust-minimized case (escrow, ADR 0032). This decision covers only the simple case.

## Decision

Add a frontend "Transfer ownership" action calling `VinCidRegistry`'s already-inherited `safeTransferFrom` directly. No contract change.

## Alternatives Considered

- Add a custom `transferOwnership(vin, to)` wrapper on `VinCidRegistry` — rejected; no VIN-specific side effect is needed today, and a wrapper risks diverging from standard ERC-721 semantics that wallets/explorers already understand for no behavioral gain.

## Consequences

- Ships with zero new contract risk; every transfer automatically feeds ADR 0029's ownership history via the standard `Transfer` event.
- No payment guarantee is provided by this feature — sellers/buyers still coordinate payment out-of-band, same as a paper title today. Explicitly left to ADR 0032 for users who want a trust-minimized alternative.
