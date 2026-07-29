# Plan 0022 — Document the compensating-unpin behavior in README's Architecture write flow — Frontend

- **ADR:** `docs/adr/0022-document-compensating-unpin-in-readme.md`
- **Paired plan:** `docs/plans/done/0022-document-compensating-unpin-in-readme-contracts.md`
- **Status:** done
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Update `README.md`'s "Architecture" → "Write flow" section to describe the compensating-unpin behavior shipped in ADR 0018: if `storeCid` fails after the IPFS pin already succeeded, the frontend unpins that CID before surfacing the original error. Purely a documentation fix — no code changes, since the behavior itself already exists and is tested by prior work.

**Out of scope:** redrawing the ASCII architecture diagram (see ADR 0022's Option B, rejected); any change to `pinata_ipfs_nft_service.js` itself.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `README.md` | modify | Insert a new step in the "Write flow" numbered list (Architecture section) describing the compensating unpin; renumber the two steps after it. |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [x] **1.** In `README.md`'s "Architecture" → "Write flow" section, insert a new step immediately after the existing `storeCid` step (currently step 3):

  > **On-chain failure after a successful pin:** if `storeCid` reverts or the wallet rejects the transaction, the frontend unpins the CID it just pinned in step 2 before surfacing the original error — a failed mint never leaves an orphaned, unreferenced IPFS entry behind ([frontend/src/utils/pinata_ipfs_nft_service.js](frontend/src/utils/pinata_ipfs_nft_service.js)).

  Renumber the current steps 4 (reward) and 5 (read) to 5 and 6.

## Interfaces with Contracts

- None — no ABI, address, or event changes; `storeCid`'s signature and behavior are unchanged. See the paired contracts plan (no-op).

## Testing

- Manual: re-read the updated "Write flow" section end-to-end and confirm it matches `handleNFTCreation` in `frontend/src/utils/pinata_ipfs_nft_service.js` line-by-line (pin → storeCid → unpin-on-failure → reward → read).
- No automated test applies to a documentation-only change.

## Risks and Rollback

- None — text-only change.
- **Rollback:** revert the `README.md` diff.

## Open Questions

None.
