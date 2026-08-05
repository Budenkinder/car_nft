# Plan 0033 — In-app notifications — Contracts

- **ADR:** `docs/adr/0033-in-app-notifications.md`
- **Paired plan:** `docs/plans/draft/0033-in-app-notifications-frontend.md`
- **GitHub Issue:** [#39](https://github.com/Budenkinder/car_nft/issues/39)
- **Status:** draft
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No contract changes. This feature is a purely client-side read over events that already exist (`Transfer`, from ADR 0029) or will exist once ADR 0030 ships (`RecordEntryAdded`). This file exists per CLAUDE.md's requirement to plan both sides even when one is a no-op.

## Files to Add / Modify

None.

## Tasks

None — no contracts-side implementation tasks for this plan.

## Contract Surface

- No changes.

## Interfaces with Frontend

- Event shapes consumed: `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)` (already deployed, ADR 0029); `RecordEntryAdded(string vin, uint8 entryType, string cid, uint256 mileage, address submitter)` (from ADR 0030 — this plan's service-reminder half cannot ship before that lands).
- No ABI re-sync or redeploy needed for this plan itself.

## Testing

- No new contract tests.

## Deployment and Migration

- None.

## Risks and Rollback

- None on the contracts side.

## Open Questions

- None.
