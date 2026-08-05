---
name: crt-pay-to-read-intent
description: The user's intended CRT model is pay-to-read (readers buy tokens to look up a VIN), not just a mint reward — and reads cannot actually be gated without encrypting the metadata.
metadata:
  type: project
  scope: contracts
---

Stated by the user on 2026-08-03: CRT is meant to be a **utility token for reading**, not only a mint reward. Registered organizations create/update VIN records; anyone who wants to read a specific VIN's details buys and spends CRT to do so. Read fees are intended to refill the pool that pays mint rewards, closing the loop so no manual top-up is needed (`readFee × lookups` vs `rewardAmount × mints`).

**Why this matters:** none of it is visible in the code. Today `_payReward` is a one-way drain from a pool funded once at deploy, and there is no fee, no purchase path, and no sink. Anyone reading only the contract would conclude CRT is decorative and propose removing or capping it — the user explicitly rejected exactly those suggestions (`docs/decisions/2026-08-03-005-defer-token-economy-to-adr-0036.md`).

**The constraint that blocks it:** a VIN's CID is public in four independent places — the `getCidByVin`/`getAllVins`/`getAllCidsAsList` views, the `CidStored` event, `tokenURI` (**required by ERC-721** — cannot be removed while it is an NFT), and public IPFS itself. So a payment gate is only real if the metadata is **encrypted** before pinning; otherwise the fee buys convenience and any technical reader bypasses it free. This is decision D1 in ADR 0036 and is unresolved.

**How to apply:** never propose "just remove the reward" or "cap the pool" — that has been rejected. When any pay-to-read design comes up, check it against the four leak surfaces first, and note the two collisions: ADR 0027 (shipped) reconstructs history from `CidStored` events, and ADR 0029 (issue #35) promises a *free* public VIN lookup — the direct opposite. See [[reward-payout-gas-estimation-risk]] for the existing silent-failure path in `_payReward` that any change here should fix rather than inherit.
