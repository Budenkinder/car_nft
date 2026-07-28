# ADR 0009: Clear the stale cross-version Hardhat build cache causing "No contracts to compile"

- **Status:** superseded by ADR-0010
- **Date:** 2026-07-19
- **Scope:** contracts
- **Related plans:**
  - `docs/plans/done/0009-stale-hardhat-cache-no-contracts-to-compile-frontend.md`
  - `docs/plans/done/0009-stale-hardhat-cache-no-contracts-to-compile-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-19-007-stale-hardhat-cache-no-contracts-to-compile.md` (superseded by `docs/decisions/2026-07-19-008-correct-no-contracts-to-compile-diagnosis.md`)

> **Superseded:** the root-cause claim below (a stale/mixed-format cache "confusing" Hardhat 3) is **incorrect**. See ADR 0010 for the corrected diagnosis: `No contracts to compile` is Hardhat 3's normal, correct message whenever every discovered `.sol` file already has a valid cached build — it fired here because `npm run compile` had already succeeded once (plan 0007, task 4) and nothing under `contracts/` had changed since. `cache/solidity-files-cache.json` (a Hardhat-2-only cache format) is inert and unread by Hardhat 3's build system; it was never the cause. This ADR is kept for the record rather than deleted, per the project's "never silently rewrite history" rule.

## Context

After ADR 0007's Hardhat 2 → 3 migration, `npm run compile` started reporting `No contracts to compile` even though both `.sol` files are present under `contracts/` and `hardhat.config.js` is unchanged from the working state verified in plan 0007.

Inspecting `cache/` explained it: `cache/solidity-files-cache.json` was dated **2026-05-22** — a leftover from the pre-migration Hardhat 2 setup — sitting next to Hardhat 3's own `cache/compile-cache.json` (dated **2026-07-19**, from yesterday's plan-0007 compile). The two cache formats are incompatible; Hardhat 3's incremental-compile detection apparently trusted the stale/mixed cache state and concluded there was nothing new to build, rather than falling back to a full compile. `artifacts/` and `cache/` are both gitignored (regenerated build output), so this was purely local environment state, not a repository or config defect.

Deleting `artifacts/` and `cache/` and re-running `npm run compile` immediately fixed it: `Compiled 2 Solidity files with solc 0.8.28 (evm target: cancun)`. Hardhat ships a built-in task for exactly this, `npx hardhat clean`, which is the supported way to do the same thing without hand-picking directories to `rm -rf`.

## Decision

Diagnosis-only, no source or config changes: the fix is operational — run `npx hardhat clean` (or delete `artifacts/`/`cache/` directly) whenever a Hardhat major-version bump (or any other change invalidates the build cache) causes phantom "nothing to compile" behavior, then re-run `npm run compile`. This is recorded as a project memory gotcha (see `docs/memory/contracts/hardhat-3-esm-migration.md`) so it isn't rediscovered from scratch next time. No change to `hardhat.config.js`, `scripts/deploy.js`, or `contracts/`.

## Options Considered

### Option A — `hardhat clean` + recompile *(chosen)*
- **Pros:** uses Hardhat's own supported mechanism for exactly this situation; safe since `artifacts/`/`cache/` are fully regenerable and gitignored; no source/config risk.
- **Cons:** has to be remembered/rediscovered if it recurs — mitigated by the memory entry.

### Option B — Manually patch or delete only the stale `solidity-files-cache.json`
- **Pros:** more surgical, leaves `compile-cache.json`/`artifacts/` untouched.
- **Cons:** more fragile — assumes the *only* stale file is that one; a full clean is simpler and equally safe given both directories are throwaway build output.

### Option C — Investigate a Hardhat config change (e.g. `paths.sources`) as the root cause
- **Pros:** would be warranted if the config were actually wrong.
- **Cons:** ruled out by testing — the config was already confirmed correct in plan 0007 (compile succeeded then); the only variable that changed was the accumulated build cache. Pursuing a config change here would have been solving the wrong problem.

## Consequences

- **Positive:** `npm run compile` works again; the gotcha (stale cross-version cache after a Hardhat major bump) is documented for next time.
- **Negative:** none — no code or config changed.
- **Frontend impact:** none.
- **Contracts impact:** none to tracked files; `artifacts/`/`cache/` (both gitignored) were regenerated.
- **Follow-ups:** none required. If this recurs after future Hardhat upgrades, `npx hardhat clean` is the first thing to reach for.

## References

- ADR 0007 — `docs/adr/0007-hardhat-3-esm-migration.md` (the migration that left the stale cache behind).
- `npx hardhat clean --help` — confirms the built-in "clear the cache and delete all artifacts" task.
