# Plan 0025 — README: sync stale recipient label — Frontend

- **ADR:** `docs/adr/0025-readme-stale-recipient-label.md`
- **Paired plan:** `docs/plans/done/0025-readme-stale-recipient-label-contracts.md`
- **Status:** done
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Update `README.md`'s "Using the app" step 3 (currently line 273) to replace the stale `**Car Owner Wallet (recipient)**` field-name reference with `**TÜV Car Inspection Wallet Address (recipient)**`, matching the label already live in `frontend/src/App.js` since ADR 0023. Copy-only change; out of scope: rewording the rest of the step, or any application code (already correct).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `README.md` | modify | Replace `**Car Owner Wallet (recipient)**` with `**TÜV Car Inspection Wallet Address (recipient)**` in step 3 of "Using the app" (currently line 273). |

## Tasks

- [x] **1.** In `README.md`, replaced `**Car Owner Wallet (recipient)**` with `**TÜV Car Inspection Wallet Address (recipient)**` at line 273.
- [x] **2.** Grepped `README.md` for remaining occurrences of `"Car Owner"` — none found.

## Interfaces with Contracts

None — documentation only.

## Testing

- Not applicable — documentation-only change. Verify by reading the updated line in context and confirming it matches `frontend/src/App.js`'s current `label` prop exactly.

## Risks and Rollback

- Risk: none — single string replacement.
- Rollback: revert the README edit.

## Open Questions

None.
