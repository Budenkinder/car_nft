# ADR 0010: Correct the ADR 0009 diagnosis — "No contracts to compile" is normal Hardhat 3 behavior

- **Status:** accepted
- **Date:** 2026-07-19
- **Scope:** contracts
- **Related plans:**
  - `docs/plans/done/0009-stale-hardhat-cache-no-contracts-to-compile-frontend.md`
  - `docs/plans/done/0009-stale-hardhat-cache-no-contracts-to-compile-contracts.md`

  (No new plan pair filed — this ADR corrects ADR 0009's documentation only; plan 0009's task log is amended with a correction note rather than superseded, since the actions it recorded — `rm -rf artifacts cache && npm run compile` — genuinely ran and genuinely produced a successful compile, they just weren't "fixing a bug".)
- **Related decisions:** `docs/decisions/2026-07-19-008-correct-no-contracts-to-compile-diagnosis.md`

## Context

ADR 0009 claimed `npm run compile` printing `No contracts to compile` was caused by a stale, cross-Hardhat-version cache (`cache/solidity-files-cache.json`, a Hardhat-2-only file dated before the ADR 0007 migration) "confusing" Hardhat 3's incremental-compile detection. That explanation does not hold up:

- Reading `node_modules/hardhat/src/internal/builtin-plugins/solidity/build-system/build-system.ts`: `No contracts to compile` is printed whenever `runnableCompilationJobs.length === 0` — i.e., every discovered `.sol` file already has a valid cache hit for the current build profile. It is the **normal, correct** message for "nothing needs (re)compiling", not an error and not evidence that contracts weren't found.
- `solidity-files-cache.json` is Hardhat 2's cache file format. Hardhat 3's build system never reads it — it's inert leftover clutter from before the ADR 0007 migration, not an active input to Hardhat 3's cache-hit logic.
- Direct test: with a valid cache, `npm run compile` reports `No contracts to compile`. Appending a comment to `contracts/car_nft_sc.sol` and recompiling correctly triggers `Compiled 1 Solidity file...` (only the changed file). Reverting the edit and recompiling again correctly returns to `No contracts to compile`. This is exactly the expected behavior of a content-hash-based incremental build cache — proof there was never a false-negative bug.
- The actual sequence: plan 0007 (task 4) already ran `npm run compile` successfully, producing valid, up-to-date `artifacts/`. Any later `npm run compile` — including the one that prompted the user's question — correctly found nothing to do and reported exactly that.

Deleting `artifacts/`/`cache/` (ADR 0009's "fix") did make `npm run compile` print a real "Compiled N Solidity files" line again — but only because deleting the cache always forces a full rebuild, not because anything was broken beforehand.

## Decision

Correct the record: `No contracts to compile` is Hardhat 3's normal way of saying "the last compile is still valid, there is nothing to rebuild." It should be read as informational, not as an error indicating missing or undiscovered contracts. `contracts/` and `hardhat.config.js` were correctly configured throughout — nothing there needed to change.

Guidance going forward (also captured in memory):
- If you want to confirm contracts actually compiled at some point, check for `artifacts/contracts/**/*.json` — their presence (with recent timestamps matching the source) means the build is up to date and usable for deploy/test.
- If you specifically want to force a full rebuild (e.g., after a compiler/plugin/version change, or to rule out cache corruption), run `npx hardhat clean` first, then `npm run compile`.
- A **true** "no contracts found" situation (e.g., `paths.sources` misconfigured, or an empty `contracts/` directory) would look different — Hardhat would report zero source files considered at all, not merely zero jobs needing a rebuild. That was never the case here (`contracts/` has always had both `.sol` files, and `paths.sources` was never touched).

## Options Considered

### Option A — Publish a correction ADR + decision, fix memory *(chosen)*
- **Pros:** keeps the documented history honest without silently rewriting ADR 0009; memory ends up accurate for future sessions.
- **Cons:** more files for what turned out to be a non-bug.

### Option B — Quietly edit ADR 0009 in place to fix the claim
- **Pros:** fewer files.
- **Cons:** violates the project's explicit "never silently rewrite history" rule for decisions/ADRs — a wrong diagnosis that was acted on (plan 0009, memory entry) deserves a visible correction trail, not a silent edit.

## Consequences

- **Positive:** memory and decision history now correctly explain what `No contracts to compile` means; no one will spend time chasing a "stale cache bug" that doesn't exist.
- **Negative:** ADR 0009 remains on record as a documented misdiagnosis (intentional, for traceability).
- **Frontend impact:** none.
- **Contracts impact:** none — no source or config change; this ADR is purely corrective documentation.
- **Follow-ups:** none.

## References

- `node_modules/hardhat/src/internal/builtin-plugins/solidity/build-system/build-system.ts` (`#printCompilationResult`, `runnableCompilationJobs`) — the exact code path that prints this message.
- ADR 0009 — the superseded, incorrect diagnosis.
