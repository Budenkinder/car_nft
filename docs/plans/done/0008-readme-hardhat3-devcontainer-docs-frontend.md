# Plan 0008 — Document Hardhat 3 migration and Dev Container in README — Frontend

- **ADR:** `docs/adr/0008-readme-hardhat3-devcontainer-docs.md`
- **Paired plan:** `docs/plans/done/0008-readme-hardhat3-devcontainer-docs-contracts.md`
- **Status:** done
- **Date:** 2026-07-19

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a new "Development environment" section to root `README.md` documenting the Dev Container (`.devcontainer/devcontainer.json`): what it provisions, the auto-forwarded port, and the gotcha that `postCreateCommand` only installs `frontend/` dependencies — root `npm install` (needed for Hardhat) must still be run manually once per fresh container. This is the "frontend side" of plan 0008 because the Dev Container's only automated action is scoped to `frontend/`, but the section documents the whole repo's dev setup.

Out of scope: any change to `frontend/` source code, any change to `.devcontainer/devcontainer.json` itself (see ADR 0008, Option C — a config fix is a separate future decision if wanted).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `README.md` | modify | Add a "Development environment" section (placement: after "Repository layout", before "Smart contracts") covering the Dev Container. |

## Tasks

- [x] **1.** Add a "Development environment" section to `README.md` covering: the Dev Container image/features (Ubuntu 24.04, Node 22, zsh, GitHub CLI), the auto-forwarded port 3000, the bundled VS Code extensions (ESLint, Solidity, Prettier), and the explicit gotcha that `postCreateCommand` only runs `npm install` in `frontend/` — root `npm install` must be run manually before any `npm run compile` / `npm run node` / `npm run deploy:*` command works. Added after "Repository layout", before "Smart contracts".

## Interfaces with Contracts

None — documentation only, no runtime interface change. The README section produced here sits alongside the contracts-side section from the paired plan (both edit the same `README.md`, different sections).

## Testing

- Manual: proofread the rendered Markdown (headings, code fences) after the edit.
- No automated tests apply to a README change.

## Risks and Rollback

- Risk: none — documentation-only, no runtime behavior affected.
- Rollback: revert the `README.md` diff.

## Open Questions

None.
