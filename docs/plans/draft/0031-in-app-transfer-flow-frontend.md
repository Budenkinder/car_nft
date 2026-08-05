# Plan 0031 — In-app wallet-to-wallet transfer — Frontend

- **ADR:** `docs/adr/0031-in-app-transfer-flow.md`
- **Paired plan:** `docs/plans/draft/0031-in-app-transfer-flow-contracts.md`
- **GitHub Issue:** [#37](https://github.com/Budenkinder/car_nft/issues/37)
- **Status:** draft
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a "Transfer ownership" action to the loaded-VIN view: recipient-address input, ownership check, and a call to `safeTransferFrom`. Out of scope: any payment coupling (ADR 0032), any off-chain paperwork.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/utils/pinata_ipfs_nft_service.js` | modify | Add `transferVinOwnership(vin, toAddress, chainId)`: resolves `tokenId` from `vin`, calls `safeTransferFrom(currentAccount, toAddress, tokenId)`, following the existing `storeCidOnBlockchain` gas-estimate/send/receipt pattern. |
| `frontend/src/components/TransferOwnershipForm.js` | add | Recipient-address input with basic checksum/non-zero validation, a confirmation step, and tx status feedback. Only rendered when the connected wallet matches `ownerOf(tokenId)`. |
| `frontend/src/App.js` | modify | Render `TransferOwnershipForm` in the "Load Car NFT" result view. |

## Tasks

- [ ] **1.** Add `transferVinOwnership` to `pinata_ipfs_nft_service.js`.
- [ ] **2.** Add `frontend/src/components/TransferOwnershipForm.js`: address input, validation (non-zero, not equal to current owner, valid checksum via `web3.utils.isAddress`), confirmation, tx status using the existing `txLog` pattern.
- [ ] **3.** Wire ownership check (connected wallet `===` `ownerOf(tokenId)`) and conditionally render the form in `App.js`'s loaded-VIN view.
- [ ] **4.** After a successful transfer, refresh the loaded VIN's displayed owner and ownership history (ADR 0029's read) without requiring a manual page reload.

## Interfaces with Contracts

- Functions called: `safeTransferFrom(address, address, uint256)`, `ownerOf(uint256)` — both standard, already in the ABI.
- Events consumed: `Transfer` — used to refresh the UI after a successful transfer.
- ABI / address handoff: unchanged.
- Network assumptions: unchanged.

## Testing

- No new unit tests (matches project convention).
- Manual verification: as the current owner, transfer a VIN to a second test wallet; confirm the form disappears for the old owner and appears for the new one on reload; confirm ADR 0029's ownership history and public lookup page immediately reflect the new owner.

## Risks and Rollback

- Risk: user error (wrong recipient address) is irreversible at the contract level — mitigate with a clear confirmation step showing the exact address and a warning that this cannot be undone by the app.
- Rollback: additive UI; removing the form and function fully reverts with no data impact.

## Open Questions

- None.
