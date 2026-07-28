# Plan 0012 — Document session learnings in README — Frontend

- **ADR:** `docs/adr/0012-readme-session-learnings.md`
- **Paired plan:** `docs/plans/done/0012-readme-session-learnings-contracts.md`
- **Status:** done
- **Date:** 2026-07-20

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a short note to `README.md`'s "Frontend" section clarifying that `ethers` (listed in `frontend/package.json`) is currently **unused** — all contract reads/writes go through `web3` (`frontend/src/utils/pinata_ipfs_nft_service.js`), confirmed by grepping `frontend/src/` for any `ethers` import (none found). This documents a finding from this session's dependency audit so it isn't rediscovered by confusion, without taking any action on the dependency itself (removal/upgrade explicitly deferred by the user).

Out of scope: removing or upgrading `ethers`, or any other `npm audit` remediation — deferred.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `README.md` | modify | One-line clarification in the "Frontend" section's stack description. |

## Tasks

- [x] **1.** Add a note to `README.md`'s "Frontend" section (near the stack line: "React 18 (CRA), Material UI 5, ethers v5, web3 v4, MetaMask provider") clarifying that `ethers` is currently unused — all contract calls go through `web3`, in `pinata_ipfs_nft_service.js`.

## Interfaces with Contracts

None — documentation only.

## Testing

- Manual: proofread the rendered Markdown after the edit; re-confirm the claim by re-grepping `frontend/src/` for `ethers` imports if anything has changed since this session.

## Risks and Rollback

- Risk: this note becomes stale if `ethers` is later actually adopted or removed. Mitigation: ADR 0012 explicitly calls out updating/removing the note if that happens.
- Rollback: revert the `README.md` diff.

## Open Questions

None.
