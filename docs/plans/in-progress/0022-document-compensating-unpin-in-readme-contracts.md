# Plan 0022 — Document the compensating-unpin behavior in README's Architecture write flow — Contracts

- **ADR:** `docs/adr/0022-document-compensating-unpin-in-readme.md`
- **Paired plan:** `docs/plans/in-progress/0022-document-compensating-unpin-in-readme-frontend.md`
- **Status:** in-progress
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No contracts changes required. The behavior being documented — unpinning an IPFS CID after a failed `storeCid` call — is entirely frontend-side orchestration around an unchanged `storeCid(vin, cid, recipient)` call; `VinCidRegistry` itself is unaffected and was already unchanged by ADR 0018 (it's atomic — a failed call reverts all of its own state, no partial state to compensate for on-chain).

## Files to Add / Modify

None.

## Tasks

None — no-op for this plan.

## Contract Surface

Unchanged.

## Interfaces with Frontend

Unchanged — same `storeCid(vin, cid, recipient)` signature as before.

## Testing

Not applicable.

## Deployment and Migration

Not applicable.

## Risks and Rollback

None.

## Open Questions

None.
