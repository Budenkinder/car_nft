# Plan 0026 — Clear form after successful registration — Frontend

- **ADR:** `docs/adr/0026-clear-form-after-successful-registration.md`
- **Paired plan:** `docs/plans/draft/0026-clear-form-after-successful-registration-contracts.md`
- **Status:** draft
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

When `handleSubmit` in `frontend/src/App.js` succeeds (`result.success`) **and** the submission was a new-VIN registration (`isNewMint === true`), reset the "Create or Update" panel's input fields (`createVin`, `recipient`, `brand`, `model`, `year`, `issue`, `shop`, `mileage`) to empty strings so the panel is ready for the next car. Out of scope: the update path (`isNewMint === false`) keeps its current behavior (fields stay populated after a successful update); the separate VIN search field (`vin`) and `vinExistsOnChain`/`vinLastCid` are not reset (see ADR 0026 Option C / Open Questions).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/App.js` | modify | In `handleSubmit`'s success branch (currently lines 166-168), after `setTxHash(result.txHash)`, add a conditional reset of the 8 form fields when `isNewMint` is `true`. |

## Tasks

- [ ] **1.** In `frontend/src/App.js`, inside `handleSubmit`'s `if (result.success)` branch (currently lines 166-168), add: if `isNewMint` is `true`, call `setCreateVin("")`, `setRecipient("")`, `setBrand("")`, `setModel("")`, `setYear("")`, `setIssue("")`, `setShop("")`, `setMileage("")`.
- [ ] **2.** Manually verify: register a new VIN successfully → all 8 fields blank out, success banner/tx link still shows. Then load an existing VIN and submit an update successfully → fields keep their values (unchanged behavior).

## Interfaces with Contracts

None — purely client-side state reset after an already-completed `storeCid` call. No new contract reads/writes.

## Testing

- No existing unit/component tests cover `handleSubmit`; none added, since this is a small state-reset addition to an already-manually-tested flow (per this repo's frontend testing approach, which relies on manual verification for UI flows — see `docs/memory/frontend/`).
- Manual verification steps: see Task 2 above. Run against a local Hardhat deploy (or Sepolia) with a wallet connected as `minter`.

## Risks and Rollback

- Risk: if `isNewMint` were somehow stale/incorrect at the time of the success callback (e.g. due to an intervening state update), the wrong branch could fire — low risk since `isNewMint` is derived synchronously from `vinExistsOnChain`, which doesn't change during the `await handleNFTCreation(...)` call.
- Rollback: remove the added `setXxx("")` calls.

## Open Questions

- Should `vinExistsOnChain`/`vinLastCid` (and possibly the separate search `vin` field) also reset after a successful new mint, so the panel looks exactly like a fresh page load? ADR 0026 treats this as out of scope (Option C) — confirm with the user if broader reset is wanted.
