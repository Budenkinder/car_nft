# Plan 0024 — README: CRT MetaMask import — Contracts

- **ADR:** `docs/adr/0024-readme-crt-metamask-import.md`
- **Paired plan:** `docs/plans/in-progress/0024-readme-crt-metamask-import-frontend.md`
- **Status:** in-progress
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No contract code changes required. The README addition is descriptive only — it references the already-deployed `CarRewardToken` contract's address, symbol (`CRT`), and decimals (`18`), all of which already exist in `contracts/car_reward_token.sol` and `deployments/sepolia.json`. This plan's only job is to confirm those facts are accurate before the frontend plan cites them.

## Files to Add / Modify

None under `contracts/`.

## Tasks

- [x] **1.** Verified `CarRewardToken`'s symbol (`CRT`) and decimals (`18`, the OpenZeppelin ERC-20 default — no override in `contracts/car_reward_token.sol`) match what the README note states.
- [x] **2.** Verified the live Sepolia addresses written into `README.md` against `deployments/sepolia.json`: CarRewardToken `0xABdC5742FFe7E34Af79f08E46D099Fd9bE3bC68c`, VinCidRegistry `0x089711b304ad2E279843588F7051AFe59797CdB8`. Cross-checked against the on-chain `Transfer` log in the Sepolia transaction receipt for `0x2bd565bd92c649bbb9016f5b24ff73483f1b9a205a54d14feb6ad5f08b4565cf` (CRT `Transfer` emitted from `0xabdc5742ffe7e34af79f08e46d099fd9be3bc68c`) — matched.

## Contract Surface

Unchanged.

## Interfaces with Frontend

Unchanged — `deployments/sepolia.json`'s `rewardToken` field remains the handoff point; the README note only restates it for human readers, it does not change how the frontend consumes it.

## Testing

Not applicable.

## Deployment and Migration

Not applicable.

## Risks and Rollback

None.

## Open Questions

None.
