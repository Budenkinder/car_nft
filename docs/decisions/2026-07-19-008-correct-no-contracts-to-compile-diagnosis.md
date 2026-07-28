---
date: 2026-07-19
scope: contracts
status: accepted
related_adr: 0010-correct-no-contracts-to-compile-diagnosis
supersedes: 2026-07-19-007-stale-hardhat-cache-no-contracts-to-compile.md
---

# Correct the diagnosis: "No contracts to compile" is normal Hardhat 3 behavior, not a cache bug

## Context

Decision 007 (and ADR 0009) claimed a stale, cross-Hardhat-version cache file caused `npm run compile` to falsely report `No contracts to compile`. Re-reading Hardhat 3's build system source (`#printCompilationResult` / `runnableCompilationJobs` in `node_modules/hardhat/src/internal/builtin-plugins/solidity/build-system/build-system.ts`) and directly testing (edit a contract → real recompile of just that file; revert → back to "No contracts to compile") proved this message fires whenever every discovered `.sol` file already has a valid cache hit — i.e., it means "already up to date," not "error, nothing found." Plan 0007's task 4 had already run a successful `npm run compile`, so the next invocation correctly found nothing to rebuild. The Hardhat-2-only `cache/solidity-files-cache.json` file was inert clutter, never read by Hardhat 3, and was not the cause.

## Decision

Supersede decision 007. The corrected understanding: `No contracts to compile` is Hardhat 3's normal "nothing to rebuild" message. No config or source defect existed. Deleting `artifacts/`/`cache/` "fixed" it only in the trivial sense that clearing the cache always forces a fresh full rebuild — it wasn't fixing a bug. Guidance for genuinely wanting a forced rebuild: `npx hardhat clean && npm run compile`. `docs/memory/contracts/hardhat-3-esm-migration.md` is corrected to remove the false "stale cross-version cache" gotcha and replace it with the accurate explanation.

## Alternatives Considered

- **Publish this correction, mark decision 007 and ADR 0009 superseded** — chosen; preserves the history (both the original, wrong reasoning and the correction are visible) without silently rewriting either file.
- **Silently edit decision 007 / ADR 0009 in place** — rejected; explicitly disallowed by the project's decision-log rules ("never silently rewrite history").

## Consequences

- **Positive:** future sessions reading memory or the decision log get the accurate explanation instead of chasing a non-existent cache bug.
- **Negative / accepted costs:** decision 007 and ADR 0009 remain on record as a documented misdiagnosis; acceptable since correcting the trail is exactly what the supersession mechanism is for.
- **Follow-ups required:** none.
