# Plan 0009 — Fix stale Hardhat build cache ("No contracts to compile") — Contracts

- **ADR:** `docs/adr/0009-stale-hardhat-cache-no-contracts-to-compile.md` (superseded by `docs/adr/0010-correct-no-contracts-to-compile-diagnosis.md` — see the correction note at the end of this file)
- **Paired plan:** `docs/plans/done/0009-stale-hardhat-cache-no-contracts-to-compile-frontend.md`
- **Status:** done
- **Date:** 2026-07-19

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Fix `npm run compile` reporting `No contracts to compile` despite `contracts/car_nft_sc.sol` and `contracts/car_reward_token.sol` both being present and `hardhat.config.js` being unchanged from its working state (verified in plan 0007). Root cause: `cache/solidity-files-cache.json` was a leftover from the pre-ADR-0007 Hardhat 2 setup (dated 2026-05-22), sitting alongside Hardhat 3's own `cache/compile-cache.json` (dated 2026-07-19) — the stale/mixed-format cache caused Hardhat 3's incremental-compile detection to conclude there was nothing new to build. `artifacts/` and `cache/` are both gitignored, regenerated-on-compile directories, so this was local environment state, not a repository defect.

Out of scope: any change to `hardhat.config.js`, `scripts/deploy.js`, or `contracts/*.sol` — none of those were implicated; this plan is a build-cache fix only.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `artifacts/` | delete + regenerate | gitignored; deleted, then recreated by `npm run compile` |
| `cache/` | delete + regenerate | gitignored; deleted, then recreated by `npm run compile` |
| `docs/memory/contracts/hardhat-3-esm-migration.md` | modify | add the "clear the cache after a Hardhat major bump" gotcha |

## Tasks

Filed directly to `done/` — the fix was a single already-verified corrective action taken during diagnosis, with no tracked-file diff to review, so the normal `draft` → `in-progress` review gate does not apply.

- [x] **1.** Reproduce: confirm `npm run compile` prints `No contracts to compile` with `contracts/` populated and `hardhat.config.js` unchanged.
- [x] **2.** Diagnose: inspect `cache/` — find `solidity-files-cache.json` dated 2026-05-22 (pre-migration, Hardhat 2 format) alongside `compile-cache.json` dated 2026-07-19 (Hardhat 3 format); identify the mixed/stale cache as the cause.
- [x] **3.** Fix: `rm -rf artifacts cache && npm run compile`. Confirmed: `Compiled 2 Solidity files with solc 0.8.28 (evm target: cancun)`. (Equivalent to, and going forward should be done via, the built-in `npx hardhat clean && npm run compile`.)
- [x] **4.** Record the gotcha in `docs/memory/contracts/hardhat-3-esm-migration.md` so a future Hardhat version bump doesn't require rediscovering this.

## Contract Surface

No changes — `contracts/car_nft_sc.sol` and `contracts/car_reward_token.sol` untouched.

## Interfaces with Frontend

None.

## Testing

- `npm run compile` succeeds and produces `artifacts/contracts/car_nft_sc.sol/VinCidRegistry.json` (verified).

## Deployment and Migration

Not applicable — no deploy behavior change; local build cache only.

## Risks and Rollback

- Risk: none — `artifacts/`/`cache/` are fully regenerable and gitignored; deleting them cannot lose tracked work.
- Rollback: not applicable (nothing tracked was changed).

## Open Questions

None.

## Correction (2026-07-19, see ADR 0010)

Task 2's diagnosis was wrong: the stale `cache/solidity-files-cache.json` was **not** the cause. `No contracts to compile` is Hardhat 3's normal message meaning the build was already up to date (from this plan's own task 3-equivalent compile back in plan 0007, task 4) — reading Hardhat's build-system source and testing directly (edit a contract → real recompile; revert → back to "No contracts to compile") confirmed this. Task 3's action (`rm -rf artifacts cache && npm run compile`) still genuinely ran and genuinely produced a successful compile, so the plan's tasks are left checked as executed — but they were forcing an unnecessary rebuild, not fixing a defect. See ADR 0010 / decision 2026-07-19-008 for the full corrected diagnosis.
