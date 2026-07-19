# Plan 0009 — Fix stale Hardhat build cache ("No contracts to compile") — Frontend

- **ADR:** `docs/adr/0009-stale-hardhat-cache-no-contracts-to-compile.md`
- **Paired plan:** `docs/plans/done/0009-stale-hardhat-cache-no-contracts-to-compile-contracts.md`
- **Status:** done
- **Date:** 2026-07-19

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

**No frontend changes required.** The reported issue ("No contracts to compile") and its fix are entirely within the root Hardhat build cache (`artifacts/`, `cache/` — both gitignored, regenerated directories). No `frontend/` file was read, touched, or affected.

## Files to Add / Modify

None.

## Tasks

None. Filed directly to `done/`: this is a diagnosis-only fix (clearing gitignored, regenerable build-cache directories) with a single already-verified corrective command and zero tracked-file diff — there is no code change here for the user to review before it can close, so the normal `draft` → `in-progress` review gate does not apply. See the paired contracts plan and ADR 0009 for the full diagnosis.

## Interfaces with Contracts

Not applicable.

## Testing

Not applicable — no frontend code changes.

## Risks and Rollback

None — no frontend surface touched.

## Open Questions

None.
