---
date: 2026-07-28
scope: contracts
status: accepted
related_adr: 0020-automated-hardhat-test-suite
supersedes: none
---

# Plan 0020 transitioned draft → in-progress

## Context

User replied `Implement 0020`, which approves and starts implementation of plan 0020 (automated Hardhat test suite for `VinCidRegistry`/`CarRewardToken`) in one step, per this repo's established pattern for `implement`/`autonomous` replies.

## Decision

Move both `0020-automated-hardhat-test-suite-frontend.md` and `0020-automated-hardhat-test-suite-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0020's `Related plans:` paths to match. The frontend plan has no tasks (no-op) but moves in lockstep with its paired contracts plan per CLAUDE.md's plan-status rules.

## Alternatives Considered

None — standard draft → in-progress transition, same pattern as prior plans (e.g. 0018).

## Consequences

- Plan 0020 trio now lives in `docs/plans/in-progress/`.
- `implement` mode executes exactly one task from the contracts plan (task 1: add the `test` npm script) and then stops for review — the frontend plan has nothing to execute.
