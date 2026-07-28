# ADR 0016: Document Hardhat account usage — ETH vs. NFT visibility — in README

- **Status:** accepted
- **Date:** 2026-07-26
- **Scope:** both
- **Related plans:**
  - `docs/plans/done/0016-readme-hardhat-nft-visibility-frontend.md`
  - `docs/plans/done/0016-readme-hardhat-nft-visibility-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-26-005-readme-hardhat-nft-visibility.md`

## Context

The user, while working through the local Hardhat deploy flow (switching MetaMask to chain ID `31337`, using the addresses `npm run node` prints), asked how the VIN NFTs minted to those addresses "work" the same way ETH balances do in MetaMask. They don't: MetaMask auto-displays native ETH balance for any connected account, but its NFT auto-detection only queries a backing API for a short list of well-known networks and does not cover Hardhat's local chain (or reliably Sepolia). A minted VIN NFT is invisible in MetaMask's UI unless manually imported — and manual import requires a token ID that isn't sequential (`uint256(keccak256(vin))`, per `_tokenIdFromVin` in `contracts/car_nft_sc.sol`), so guessing token IDs 1/2/3 doesn't work either.

This is exactly the kind of non-obvious, since-clarified knowledge this repo's README already collects (see ADR 0012's precedent) — a future contributor hitting "the app says I minted, but MetaMask shows nothing" would otherwise have to rediscover this from scratch.

## Decision

Add a note to `README.md`'s "Option 1 — Local deploy" section (right after the existing MetaMask localhost-network setup steps) explaining the ETH-vs-NFT visibility gap and the two ways to actually see a minted NFT: the frontend's own "Show All Registered NFTs" button (reads the contract directly), or a manual MetaMask NFT import using the contract address and the `keccak256(vin)`-derived token ID. Add a matching one-line entry to the "Troubleshooting" section for quick lookup.

No contract code changes — the token ID derivation being referenced (`_tokenIdFromVin`) already exists and is already documented via NatSpec in `contracts/car_nft_sc.sol`; this ADR only surfaces that existing fact in a second, more discoverable location (the README).

## Options Considered

### Option A — Add to README's local-deploy section + Troubleshooting (chosen)
- **Pros:** Matches ADR 0012's established pattern for capturing session learnings in README where a contributor will actually see them (right where they just set up MetaMask, plus the troubleshooting index).
- **Cons:** Slightly lengthens an already-long README section.

### Option B — Only add to Troubleshooting
- **Pros:** Smaller diff.
- **Cons:** A contributor following the happy path top-to-bottom wouldn't see it until they hit the confusion and went looking — worse discoverability than placing it inline where MetaMask setup happens.

### Option C — New standalone "NFTs in MetaMask" section
- **Pros:** More prominent.
- **Cons:** Over-structuring for a two-paragraph clarification; README already has enough top-level sections.

## Consequences

- **Positive:** Contributors following the local-deploy flow won't be confused when a mint succeeds but MetaMask shows nothing.
- **Negative:** None of note.
- **Frontend impact:** Documentation only — clarifies that "Show All Registered NFTs" is the reliable way to verify a local mint.
- **Contracts impact:** Documentation only — surfaces the existing `_tokenIdFromVin` derivation in a second location; no code change.
- **Follow-ups:** None.

## References

- `contracts/car_nft_sc.sol:126-128` (`_tokenIdFromVin`)
- `frontend/src/utils/pinata_ipfs_nft_service.js` (`getAllRegisteredNfts`)
- ADR 0012 (precedent for README session-learnings documentation)
