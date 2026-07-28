# Plan 0024 — README: CRT MetaMask import — Frontend

- **ADR:** `docs/adr/0024-readme-crt-metamask-import.md`
- **Paired plan:** `docs/plans/in-progress/0024-readme-crt-metamask-import-contracts.md`
- **Status:** in-progress
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a `README.md` note (parallel to the existing "ETH balance vs. NFT tokens" callout from ADR 0016) explaining that MetaMask does not auto-detect the CRT ERC-20 balance either, and that seeing it requires manually adding the token via Assets → *Import tokens* with the CarRewardToken contract address. Add a matching Troubleshooting bullet. Correct the two stale hardcoded Sepolia addresses in the existing "Reference deployment (Sepolia)" section so the address this note points readers to is accurate. Out of scope: fixing the stale `"Car Owner Wallet (recipient)"` label reference at `README.md:268` (unrelated topic, left for the user to request separately if wanted); any application code change.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `README.md` | modify | (1) Add a new "CRT (ERC-20) reward balance" note directly after the existing NFT-visibility note (currently ending line 177, before line 179). (2) Add one Troubleshooting bullet after the existing "NFT doesn't show up in MetaMask after minting" bullet (currently line 342). (3) Correct the two stale addresses in "Reference deployment (Sepolia)" (currently lines 228-229) to match `deployments/sepolia.json`. |

## Tasks

- [x] **1.** In `README.md`, after the existing "ETH balance vs. NFT tokens" paragraph and its two bullets (ending at current line 177), added a new "CRT (ERC-20) reward balance" paragraph (lines 179-182): states MetaMask's automatic token detection doesn't cover the CRT ERC-20 balance either, notes the reward always lands in `recipient` (cross-linked to "Using the app"), and gives manual-import steps (Assets → Import tokens) with the address source for both networks.
- [x] **2.** In `README.md`'s "Troubleshooting" section, added a bullet after "NFT doesn't show up in MetaMask after minting" (line 348): "**CRT reward paid but not visible in MetaMask**" — explains it's expected, distinct from the existing "Reward not received" bullet, and links back to the new note.
- [x] **3.** In `README.md`'s "Reference deployment (Sepolia)" section, replaced the stale addresses with the current ones from `deployments/sepolia.json`: CarRewardToken `0xABdC5742FFe7E34Af79f08E46D099Fd9bE3bC68c`, VinCidRegistry `0x089711b304ad2E279843588F7051AFe59797CdB8`.

## Interfaces with Contracts

- No new interface. References the existing `rewardToken` field written by `scripts/deploy.js` into `deployments/localhost.json` / `deployments/sepolia.json`, and the `CarRewardToken` contract's fixed `18` decimals / `CRT` symbol from `contracts/car_reward_token.sol`.

## Testing

- Not applicable — documentation-only change. Verify by reading the rendered `README.md` for correct Markdown, correct cross-references, and that the addresses in task 3 exactly match `deployments/sepolia.json`.

## Risks and Rollback

- Risk: none — additive/corrective documentation only.
- Rollback: revert the README edit.

## Open Questions

None.
