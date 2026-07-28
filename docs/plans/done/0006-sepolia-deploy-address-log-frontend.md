# Plan 0006 — Sepolia deploy address log — Frontend

- **ADR:** `docs/adr/0006-sepolia-deploy-address-log.md`
- **Paired plan:** `docs/plans/done/0006-sepolia-deploy-address-log-contracts.md`
- **Status:** done
- **Date:** 2026-05-21

> Plan files live in a subfolder named after their `Status:` value. New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

**No frontend changes required.** Justification: this request is satisfied entirely by a `scripts/deploy.js` change that writes a documentation file under `docs/deployments/` (see the paired contracts plan). No contract surface, ABI, address handoff, or event consumed by the frontend is affected — `frontend/` is not touched.

## Open Questions

- None.
