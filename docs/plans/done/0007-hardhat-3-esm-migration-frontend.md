# Plan 0007 — Migrate Hardhat config and scripts to Hardhat 3 + ESM — Frontend

- **ADR:** `docs/adr/0007-hardhat-3-esm-migration.md`
- **Paired plan:** `docs/plans/done/0007-hardhat-3-esm-migration-contracts.md`
- **Status:** done
- **Date:** 2026-07-19

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

**No frontend changes required.** This request is a Hardhat-tooling migration (Hardhat 2 → Hardhat 3, CommonJS → ESM) confined to `hardhat.config.js`, `scripts/deploy.js`, and `package.json`/`package-lock.json`. The frontend-facing outputs of `scripts/deploy.js` — the ABI written to `frontend/src/utils/contract_abi.json` and the address written to `frontend/.env.local` — keep the exact same file paths, format, and content shape after the migration (see the contracts plan, task 4). No Solidity source, event, or function signature changes are involved, so there is nothing for the frontend to consume differently.

Out of scope: any frontend code change, any React/web3.js change, any UI verification. This file exists only to satisfy the "plan both sides together" rule.

## Files to Add / Modify

None.

## Tasks

None.

## Interfaces with Contracts

Unchanged. The frontend continues to read:

- ABI from `frontend/src/utils/contract_abi.json` (written by `scripts/deploy.js`, unchanged format: `{ abi }` extracted from the compiled artifact JSON).
- Deployed address from `frontend/.env.local` (`REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` / `REACT_APP_SMART_CONTRACT_ADDRESS`, unchanged keys).
- No new events, no changed function signatures.

## Testing

Not applicable — no frontend code changes. If desired, after the contracts-side migration lands, a manual smoke check that `npm run deploy:local` still updates `frontend/.env.local` and `frontend/src/utils/contract_abi.json` as before would confirm the handoff is intact (covered by the contracts plan's testing section).

## Risks and Rollback

None — no frontend surface touched.

## Open Questions

None.
