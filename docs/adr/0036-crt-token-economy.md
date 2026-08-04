# ADR 0036: CRT token economy — pay-to-read VIN details funding the mint reward pool

- **Status:** proposed *(draft — blocked on decision D1, see below; no option is chosen yet)*
- **Date:** 2026-08-03
- **Scope:** both
- **Related plans:**
  - `docs/plans/draft/0036-crt-token-economy-frontend.md`
  - `docs/plans/draft/0036-crt-token-economy-contracts.md`
- **Related decisions:** `docs/decisions/2026-08-03-005-defer-token-economy-to-adr-0036.md`

## Context

`CarRewardToken` (CRT) exists today but has no economy around it. The registry holds a pool funded once at deploy (`REWARD_FUND`); `_payReward` sends `rewardAmount` to the recipient on every new mint, and nothing ever refills the pool. Rewards are a one-directional drain with a finite end.

The user's intended model, stated 2026-08-03: **registered organizations create and update VIN records; anyone wanting to read a specific VIN's details must spend CRT to do so.** That creates demand for the token, and — the user's question that prompted this ADR — the read fees become the top-up mechanism, so consumption and rewards are two halves of one loop rather than two problems:

```
reader pays readFee (CRT) ──► registry pool ──► rewardAmount on mint ──► org / car owner
        ▲                                                                      │
        └──────────── sold or spent back into circulation ◄────────────────────┘
```

If `readFee × lookups > rewardAmount × mints`, the pool grows unaided and no manual top-up is ever needed. That is the healthy state, since one car is read many more times than it is written.

**The blocking problem is that reads cannot be gated on a public chain.** A VIN's CID is currently exposed in four independent places, any one of which defeats a paywall:

1. `getCidByVin` / `getAllVins` / `getAllCidsAsList` — public `view`, callable free from any RPC node or Etherscan, never touching this project's UI.
2. `CidStored(string vin, string cid, uint256 tokenId)` — every CID ever written, in the clear, in the event log, permanently.
3. `tokenURI(tokenId)` — **required by ERC-721.** An NFT publishes its metadata pointer; that is what makes it an NFT.
4. The IPFS content itself — public gateway, unauthenticated, content-addressed.

Removing the getters fixes nothing while (2), (3) and (4) stand, and (3) cannot be removed without ceasing to be an NFT. Therefore: **a payment gate is only real if the metadata itself is encrypted** — pay, receive the decryption key. Otherwise the fee buys convenience, and anyone technical reads the data for free.

That single fork determines everything else in this ADR, so no option is chosen here yet.

## Decision

**Not yet made.** This ADR is a draft pending **D1**:

> **D1 — Real paywall or soft paywall?**
>
> - **Real:** metadata is encrypted before pinning; payment releases a key. Requires a key-management scheme (threshold decryption à la Lit Protocol, or a key server that checks payment — the latter needs a backend this project does not have). Requires `CidStored` to stop carrying `cid`, which **breaks the just-shipped ADR 0027 provenance feature**. Requires ADR 0029's free public VIN lookup to be dropped or rewritten — its entire premise is that a buyer can check a car for free.
> - **Soft:** the UI asks for payment before displaying details; the data stays publicly readable to anyone who queries the chain directly. Honest as a demo of the economics, worthless as protection. Costs almost nothing and breaks nothing.

Everything below is contingent on D1 and is recorded so the design work is not lost:

**Sub-decisions, both paths:**

- **D2 — Where does the fee go?** Burn (deflationary, but does not fund rewards); to the registry pool (self-funding — closes the loop, recommended); or split with the organization that authored the record (pays shops for publishing data people actually read — the strongest incentive alignment, most complex).
- **D3 — How do readers acquire CRT?** There is no primary market today, so demand cannot be satisfied and the loop never starts. Simplest is a `payable` purchase function at a fixed ETH rate; a DEX pool is the realistic alternative and considerably more work.
- **D4 — Fee/reward ratio and who sets it.** Both are owner-settable, and under ADR 0035 the owner is a 2-of-3 Safe, so every economic adjustment becomes a multisig transaction.
- **D5 — Free reads for the car's own NFT owner?** Charging an owner to read their own vehicle's history would be perverse; needs an explicit exemption either way.

## Options Considered

*(Provisional — to be completed once D1 is answered.)*

### Option A — Real paywall: encrypted metadata + on-chain payment unlocking a key
- **Pros:** The only design where the fee buys something that cannot be obtained free. Makes CRT genuinely useful rather than decorative.
- **Cons:** Key management is the whole problem and none of it is simple. Threshold networks add an external dependency; a key server adds the backend this project has deliberately avoided. Breaks ADR 0027 (shipped) and contradicts ADR 0029 (queued). Encrypted metadata also means the NFT is no longer publicly interpretable, which is arguably a different product.

### Option B — Soft paywall: UI-level gate, data remains public
- **Pros:** Cheap, breaks nothing, demonstrates the token loop end-to-end, reversible.
- **Cons:** Provides no actual exclusivity. If the token's value rests on paid access, that value is fictional the moment someone reads the chain directly. Must be documented as a demo, never described to users as protection.

### Option C — Do nothing; leave CRT as a mint-time reward with a finite pool
- **Pros:** Zero work; the current system keeps functioning until the pool empties.
- **Cons:** Does not answer the user's model at all, and the pool still drains — faster once ADR 0035 lets many organizations mint.

## Consequences

*(To be completed once D1 is answered.)* Known regardless:

- **Conflicts with shipped work:** ADR 0027's provenance feature reads CIDs out of `CidStored` events — free access to exactly the data a real paywall would charge for.
- **Conflicts with queued work:** ADR 0029 (issue #35) promises a free public VIN lookup so a buyer can check a car before purchase. That is the direct opposite of pay-to-read. One of the two has to give, and that is a product decision, not a technical one.
- **Regulatory:** selling a token that buys access to a service is closer to consumer/financial regulation than anything this project has touched. Out of scope for the ADR, worth the user's attention before any mainnet consideration.

## References

- `contracts/car_nft_sc.sol:150-153` (`_payReward`), `:122-136` (public getters), `:40` (`CidStored`), `:92` (`_setTokenURI`).
- `contracts/car_reward_token.sol` — CRT, separately `Ownable`, `mint` is owner-only.
- `docs/adr/0027-nft-transaction-provenance-link.md` — shipped; reads CIDs from events.
- `docs/adr/0029-ownership-history-public-lookup.md` — queued; premised on free public reads.
- `docs/adr/0035-org-role-multisig-admin.md` — the role model this economy sits on; deliberately leaves `rewardAmount` untouched.
- `docs/memory/contracts/reward-payout-gas-estimation-risk.md` — the existing silent-failure path in `_payReward`, unresolved and relevant to any change here.
