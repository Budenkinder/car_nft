---
date: 2026-07-29
scope: contracts
status: accepted
related_adr: 0020-automated-hardhat-test-suite
supersedes: none
---

## Context

Plan 0020 (automated Hardhat test suite for `VinCidRegistry` and `CarRewardToken`) had every task checked `[x]` in `docs/plans/in-progress/`: `test/fixtures.js`, `test/CarRewardToken.test.js`, `test/VinCidRegistry.test.js`, `test/VinCidRegistry.edgeCases.test.js`, the two mock contracts, `scripts/generate-test-report.js`, the `test`/`test:report` npm scripts, README documentation, and the committed `docs/testing/automated-test-report.md`. Git history shows this landed across `de79b45` (implement automated Hardhat test suite and CI for contracts) and `0886bee` (add automated Hardhat test suite), merged via PR #29 (`281d31b`). The user confirmed this work is complete and asked for plan status to be reviewed.

## Decision

Transition plan 0020 (both `-frontend.md` and `-contracts.md`) from `in-progress` to `done`:

1. `git mv` both files to `docs/plans/done/`.
2. Updated both files' `Status:` frontmatter to `done` and `Paired plan:` paths to the new folder.
3. Rewrote ADR 0020's `Related plans:` paths to point at `docs/plans/done/`.

Verified in the working tree: `test/` contains all four listed test/fixture files, `docs/testing/automated-test-report.md` exists and is committed.

## Alternatives considered

- None — all tasks were already checked and the code/test artifacts were confirmed present and merged; no ambiguity to resolve.

## Consequences

`docs/plans/done/` now reflects that the automated contract test suite has shipped. The plan's Open Questions (reentrancy state-divergence, default-gas-estimation reward-payout risk) remain unresolved design questions for the user to decide on separately — moving the plan to `done` does not close those, it only reflects that this plan's own scope (adding the tests) is complete.
