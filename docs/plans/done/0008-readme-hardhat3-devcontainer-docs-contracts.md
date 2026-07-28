# Plan 0008 — Document Hardhat 3 migration and Dev Container in README — Contracts

- **ADR:** `docs/adr/0008-readme-hardhat3-devcontainer-docs.md`
- **Paired plan:** `docs/plans/done/0008-readme-hardhat3-devcontainer-docs-frontend.md`
- **Status:** done
- **Date:** 2026-07-19

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Update the "Deploying the smart contracts" section of root `README.md` to note that the Hardhat setup is now **Hardhat 3, running as an ESM project** (`"type": "module"` in `package.json`; `hardhat.config.js` and `scripts/deploy.js` use `import`/`export`, not `require`/`module.exports`). This documents ADR 0007 / plan 0007's already-completed migration so a future contributor editing `hardhat.config.js` or `scripts/deploy.js` doesn't reach for CommonJS syntax by habit.

Out of scope: any change to `hardhat.config.js`, `scripts/deploy.js`, or any other `contracts/`/Hardhat file — the migration itself is done (plan 0007); this plan only documents it.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `README.md` | modify | Add a one-paragraph note under "Deploying the smart contracts" (or its "Prerequisites" subsection) stating Hardhat 3 + ESM, and that compile also produces a gitignored `types/` (TypeChain) directory. |

## Tasks

- [x] **1.** Add a short note to `README.md`'s "Deploying the smart contracts" section: Hardhat 3, ESM (`hardhat.config.js`/`scripts/deploy.js` use `import`/`export`), toolbox package is `@nomicfoundation/hardhat-toolbox-mocha-ethers`, and `npm run compile` also generates a gitignored `types/` directory (TypeChain bindings) alongside `artifacts/`/`cache/`.

## Contract Surface

No changes — Solidity contracts, functions, and events are untouched. This plan is documentation only.

## Interfaces with Frontend

None — no ABI, event, or address handoff change. Sits alongside the frontend-side plan's "Development environment" section in the same `README.md`.

## Testing

- Manual: proofread the rendered Markdown after the edit; confirm the note matches the actual `hardhat.config.js`/`scripts/deploy.js` content (ESM syntax, toolbox package name) currently in the repo.
- No Hardhat tests apply to a documentation change.

## Deployment and Migration

Not applicable — no deploy/migration behavior changes, only its description in README.

## Risks and Rollback

- Risk: none — documentation-only.
- Rollback: revert the `README.md` diff.

## Open Questions

None.
