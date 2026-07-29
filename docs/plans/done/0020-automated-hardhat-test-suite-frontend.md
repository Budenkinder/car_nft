# Plan 0020 — Automated Hardhat test suite for VinCidRegistry and CarRewardToken — Frontend

- **ADR:** `docs/adr/0020-automated-hardhat-test-suite.md`
- **Paired plan:** `docs/plans/done/0020-automated-hardhat-test-suite-contracts.md`
- **Status:** done
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No frontend changes required. This plan adds automated Hardhat tests for `contracts/car_nft_sc.sol` and `contracts/car_reward_token.sol` — no ABI, deployed-address, or event shape changes result, so the frontend has nothing to consume differently. The tests run against Hardhat's own ephemeral in-process network, entirely decoupled from anything the frontend talks to.

## Files to Add / Modify

None.

## Tasks

None — no-op for this plan.

## Interfaces with Contracts

- Unchanged. No new functions, events, or ABI surface — see the paired contracts plan.

## Testing

Not applicable — no frontend code changes to test.

## Risks and Rollback

None — no frontend surface touched.

## Open Questions

None.
