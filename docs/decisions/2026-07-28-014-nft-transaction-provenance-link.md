---
date: 2026-07-28
scope: both
status: proposed
related_adr: 0027-nft-transaction-provenance-link
supersedes: none
---

# Reconstruct per-VIN transaction provenance from existing `CidStored` events, not off-chain storage

## Context

User asked whether an NFT record's lack of a visible link to its originating Ethereum transaction is a trust gap, and how to close it. Confirmed `storeCid` already emits `CidStored(vin, cid, tokenId)` on both mint and every update (`contracts/car_nft_sc.sol:74`), so the full history is already recoverable from on-chain events without any contract change — the only real gap is that the frontend never queries or displays it (the only tx hash ever shown is a transient post-submit banner, lost on reload).

## Decision

Wrote ADR 0027 and a draft plan trio (0027) choosing to reconstruct history by querying past `CidStored` events client-side (filtered by VIN, since the event doesn't index `vin`/`tokenId`), rather than persisting tx hashes off-chain — the off-chain option would be an unverifiable claim and defeats the trust purpose. Contracts side gets one small addition (record deployment block in `deployments/*.json` and sync to the frontend) purely to bound the event scan efficiently for future deploys; the currently-live Sepolia contract falls back to scanning from block 0. Plans start in `docs/plans/draft/`, no code changed yet.

## Alternatives Considered

- **Add `indexed` to `CidStored`'s tokenId for RPC-side filtering** — rejected for now: breaking ABI change requiring a full redeploy, and old pre-upgrade events still wouldn't match the new topic filter, so a fallback scan would be needed regardless. Documented in the ADR as a future scalability path (Option B), not adopted.
- **Persist tx hashes off-chain (DB or IPFS metadata)** — rejected: unverifiable, and causally impossible for the mint's own tx hash (CID must be pinned before `storeCid` is called, so the hash doesn't exist yet at pin time).

## Consequences

- **Positive:** Once implemented, every VIN record — new or historical — can show a verifiable, Etherscan-linked list of the transactions that created and updated it.
- **Negative / accepted costs:** Client-side event scanning cost grows with total event count; acceptable at current scale, revisit (Option B) if usage grows significantly.
- **Follow-ups required:** Awaiting user's `implement`/`autonomous` command. Left as an open question in the frontend plan: whether to also add a tx link per row in "Show All Registered NFTs" (deferred, not committed).
