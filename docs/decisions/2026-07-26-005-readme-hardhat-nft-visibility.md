---
date: 2026-07-26
scope: both
status: accepted
related_adr: 0016-readme-hardhat-nft-visibility
supersedes: none
---

## Context

User asked how Hardhat-generated addresses "work" with NFT tokens the way they already do with ETH, while following the local-deploy MetaMask setup steps in the README. Answered inline in chat: MetaMask auto-shows ETH balance for any account, but its NFT auto-detection doesn't cover Hardhat's local chain, so a minted VIN NFT won't appear without either using the app's own "Show All Registered NFTs" button or manually importing it into MetaMask with the contract address and a token ID computed as `uint256(keccak256(vin))`. User asked for this to be added to the README.

## Decision

Document this in `README.md` in two places: a paragraph in "Option 1 — Local deploy" right after the existing MetaMask setup steps, and a one-line "Troubleshooting" bullet — following the same pattern ADR 0012 established for capturing session learnings where a contributor will actually see them. No contract changes: the token ID derivation being referenced (`_tokenIdFromVin`) already exists in `contracts/car_nft_sc.sol`.

## Alternatives considered

- Troubleshooting-only — rejected, worse discoverability for someone following the happy path.
- New standalone README section — rejected, over-structuring for a two-paragraph clarification.

## Consequences

- Contributors following the local-deploy flow will understand why a successful mint doesn't show up in MetaMask automatically.
- No frontend or contracts code touched.
