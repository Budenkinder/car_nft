# Plan 0016 — README: Hardhat NFT visibility — Frontend

- **ADR:** `docs/adr/0016-readme-hardhat-nft-visibility.md`
- **Paired plan:** `docs/plans/done/0016-readme-hardhat-nft-visibility-contracts.md`
- **Status:** done
- **Date:** 2026-07-26

## Scope and Goals

Add a note to `README.md` explaining that MetaMask auto-shows ETH balance for any Hardhat test account but does **not** auto-detect the VIN NFTs minted by the app, and give the two ways to actually see a minted NFT: the frontend's "Show All Registered NFTs" button, or a manual MetaMask NFT import (contract address + token ID). Out of scope: any code change to the frontend itself — this is documentation only.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `README.md` | modify | Add a paragraph after the existing MetaMask localhost-network setup steps in "Option 1 — Local deploy" (currently ending around line 160), and one bullet in "Troubleshooting". |

## Tasks

- [x] **1.** In `README.md`'s "Option 1 — Local deploy" section, add a paragraph after the existing MetaMask setup steps: ETH balance shows automatically; NFTs don't (MetaMask's auto-detection doesn't cover Hardhat's local chain); use the app's "Show All Registered NFTs" button to verify a mint, or manually import the NFT in MetaMask using the contract address and token ID.
- [x] **2.** Add a one-line bullet to `README.md`'s "Troubleshooting" section: "NFT doesn't show up in MetaMask after minting" — pointing back to the same explanation.

## Interfaces with Contracts

- References `_tokenIdFromVin` (`contracts/car_nft_sc.sol:126-128`) to explain that the MetaMask-import token ID is `uint256(keccak256(vin))`, not sequential. No new interface — existing `getAllVins`/`getAllCidsAsList` reads (already used by "Show All Registered NFTs") are what's being pointed to as the reliable verification path.

## Testing

- Not applicable — documentation-only change. Verify by reading the rendered `README.md` for correct Markdown and that the new paragraph/bullet read clearly in context.

## Risks and Rollback

- Risk: none — additive documentation.
- Rollback: revert the README edit.

## Open Questions

None.
