---
date: 2026-08-03
scope: both
status: accepted
related_adr: 0036-crt-token-economy
supersedes: none
---

# The CRT pay-to-read economy is split into ADR 0036; ADR 0035 leaves rewards untouched

## Context

Asked how to handle reward-pool drain once many organizations can mint, the user rejected every option offered (leave it, disable it, cap it, org-funded, add a skipped-reward event) and explained the intended model instead: **registered orgs write records; readers purchase CRT to look up a VIN's details**, creating demand. Their question was how top-up, rewards and consumption coexist.

The answer is that they are one loop — read fees refill the pool that pays mint rewards, and if reads outnumber mints the pool is self-funding. But this is a different design from anything in ADR 0035, and it runs into a hard constraint: **reads cannot be gated on a public chain.** A VIN's CID is exposed via public getters, the `CidStored` event, `tokenURI` (required by ERC-721), and public IPFS. A payment gate is only real if the metadata is encrypted.

## Decision

Split the economy into its own ADR 0036, written as a **draft blocked on D1** — real paywall (encrypted metadata, key management, ADR 0027 broken, ADR 0029 contradicted) versus soft paywall (UI gate, data still public). No option is chosen; D2-D5 (fee destination, primary market, ratios, exemptions) are recorded but contingent.

ADR 0035 leaves `rewardAmount`, `_payReward` and the pool exactly as they are, so the role model can ship without waiting on any of this.

## Alternatives Considered

- **Split into ADR 0036, blocked on D1** *(chosen)* — keeps 0035 shippable and forces the paywall question to be answered before design work is spent on either branch.
- **Fold the economy into ADR 0035** — rejected: it would block a security fix (the open-update hole) behind an unresolved product decision.
- **Pick a branch now and write a full plan** — rejected: the branches share almost no implementation, so half the work would be discarded. The soft branch is ~a tenth of the real branch's effort and breaks nothing.
- **Apply one of the original A-E reward options anyway** — rejected by the user; they do not fit the intended model.

## Consequences

- **Positive:** ADR 0035 is unblocked. The reads-are-free constraint is documented before it is discovered mid-implementation.
- **Negative / accepted costs:** the pool still drains on the current one-way basis until 0036 is resolved, and faster once many orgs can mint. Accepted deliberately: on Sepolia with a POC volume, an empty pool means new car owners silently stop receiving CRT, which is not a correctness failure.
- **Known conflicts to resolve in 0036:** ADR 0027 (shipped) reads CIDs from `CidStored` events — free access to precisely what a real paywall would charge for. ADR 0029 (issue #35) promises a *free* public VIN lookup, the direct opposite of pay-to-read. One of the two must give; that is a product decision.
- **Follow-ups required:** the user answers D1. Also unresolved and pre-existing: `_payReward`'s silent-failure path under default gas estimation (`docs/memory/contracts/reward-payout-gas-estimation-risk.md`), which any change here should fix rather than inherit.
