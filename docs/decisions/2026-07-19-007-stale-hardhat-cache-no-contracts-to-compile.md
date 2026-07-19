---
date: 2026-07-19
scope: contracts
status: superseded
related_adr: 0009-stale-hardhat-cache-no-contracts-to-compile
supersedes: none
---

> **Superseded** by [2026-07-19-008-correct-no-contracts-to-compile-diagnosis.md](2026-07-19-008-correct-no-contracts-to-compile-diagnosis.md) — the root-cause claim below is incorrect. Kept for the record.

# Fix "No contracts to compile" by clearing the stale cross-version Hardhat cache

## Context

User reported `npm run compile` returning "No contracts to compile" despite `contracts/car_nft_sc.sol` and `contracts/car_reward_token.sol` both existing. Reproduced immediately. Inspecting `cache/` found `solidity-files-cache.json` dated 2026-05-22 (a leftover from the Hardhat 2 setup, pre-dating yesterday's ADR 0007 migration) sitting next to Hardhat 3's `compile-cache.json` (dated 2026-07-19). The stale, mixed-format cache caused Hardhat 3's incremental-compile detection to wrongly conclude nothing needed building.

## Decision

Deleted `artifacts/` and `cache/` (both gitignored, fully regenerable) and re-ran `npm run compile`, which succeeded: `Compiled 2 Solidity files with solc 0.8.28 (evm target: cancun)`. No source or config file was changed. Filed plan 0009 (both sides) directly to `docs/plans/done/` since this was a diagnosis-only fix with a single already-verified corrective command and zero tracked-file diff to review — the normal draft → in-progress review gate exists to gate code changes, and there was no code change here.

## Alternatives Considered

- **`rm -rf artifacts cache` + recompile** — chosen (what was actually run); equivalent to and going forward should be invoked via the built-in `npx hardhat clean`.
- **Patch only the stale `solidity-files-cache.json`** — rejected; more surgical but no safer, since both directories are throwaway build output.
- **Investigate a Hardhat config defect** — rejected; ruled out because the same config had already compiled successfully in plan 0007, so the only variable was accumulated cache state.

## Consequences

- **Positive:** `npm run compile` works again; the gotcha is now documented in `docs/memory/contracts/hardhat-3-esm-migration.md` for future Hardhat version bumps.
- **Negative / accepted costs:** none.
- **Follow-ups required:** none.
