# Plan 0034 — File a GitHub tracking issue on plan approval — Contracts

- **ADR:** `docs/adr/0034-github-issue-on-plan-approval.md`
- **Paired plan:** `docs/plans/done/0034-github-issue-on-plan-approval-frontend.md`
- **GitHub Issue:** [#40](https://github.com/Budenkinder/car_nft/issues/40)
- **Status:** done
- **Date:** 2026-08-01

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

**No changes required.** This is a docs/workflow change only. No Solidity source under `contracts/`, no Hardhat script under `scripts/`, no `hardhat.config.js` setting, and no deployment artifact under `deployments/` is touched. No ABI, no contract surface, no storage layout, no on-chain state, no migration, no gas impact.

The actionable docs-and-workflow tasks for this ADR live in the paired frontend plan ([0034-github-issue-on-plan-approval-frontend.md](0034-github-issue-on-plan-approval-frontend.md)), following the convention set by plan 0002.

One note for future contracts work: from the moment ADR 0034 is adopted, any contracts plan reaching `approved/` — including the queued 0030/0031/0032 trios, which already carry issues #36–#38 from draft time — must have a live `GitHub Issue:` link on **both** files of its trio. That is a checklist item on the approval transition, not a change to anything in this directory.
