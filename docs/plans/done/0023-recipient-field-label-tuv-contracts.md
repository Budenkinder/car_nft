# Plan 0023 — Relabel recipient field to "TÜV Car Inspection Wallet Address" — Contracts

- **ADR:** `docs/adr/0023-recipient-field-label-tuv.md`
- **Paired plan:** `docs/plans/done/0023-recipient-field-label-tuv-frontend.md`
- **Status:** done
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No changes required. This is a UI-only label/copy change to a `TextField` in `frontend/src/App.js`; it does not touch the `VinCidRegistry` contract, its ABI, events, or the `recipient` argument's type/meaning (still a wallet address). No Hardhat scripts, config, or deployment artifacts are affected.

## Files to Add / Modify

None.

## Tasks

None.

## Contract Surface

Unchanged.

## Interfaces with Frontend

Unchanged — the frontend continues to pass `recipient` (a wallet address string) to the existing mint call exactly as before.

## Testing

Not applicable — no contract or script changes.

## Deployment and Migration

Not applicable.

## Risks and Rollback

Not applicable.

## Open Questions

None.
