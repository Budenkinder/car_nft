# Plan 0023 — Relabel recipient field to "TÜV Car Inspection Wallet Address" — Frontend

- **ADR:** `docs/adr/0023-recipient-field-label-tuv.md`
- **Paired plan:** `docs/plans/done/0023-recipient-field-label-tuv-contracts.md`
- **Status:** done
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Change the visible `label` text of the recipient `TextField` in the mint form from `"Car Owner Wallet (recipient)"` to `"TÜV Car Inspection Wallet Address (recipient)"`. This is a copy-only change confined to one JSX attribute. Out of scope: renaming the `recipient` state variable, `errors.recipient`, the helper/error text, or any validation/handler logic.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/App.js` | modify | Change `label` prop on the recipient `TextField` (currently line 383) from `"Car Owner Wallet (recipient)"` to `"TÜV Car Inspection Wallet Address (recipient)"`. |

## Tasks

- [x] **1.** In `frontend/src/App.js`, update the `label` prop of the recipient `TextField` (currently `"Car Owner Wallet (recipient)"`, line 383) to `"TÜV Car Inspection Wallet Address (recipient)"`.
- [x] **2.** Verify the new label renders correctly (including the `Ü` character) for a new (unregistered) VIN. **Deviation:** no browser automation tooling (chromium-cli, Playwright) is available in this sandbox, so a real visual/screenshot check was not possible. Verified instead via `npm run build`: build compiled successfully, and the minified bundle contains the label with `Ü` correctly encoded (`\xdc`, i.e. U+00DC). A human visual check in an actual browser is still recommended before considering this fully confirmed.

## Interfaces with Contracts

- Functions called: unchanged — `handleNFTCreation(carData, recipientForCall, chainId)` still passes a wallet address string as `recipient`.
- Events consumed: none affected.
- ABI / address handoff: unaffected.
- Network assumptions: unaffected (Sepolia, chain id `0xaa36a7`, per the prior deploy).

## Testing

- No unit/component tests exist for this label today; none added, since this is static copy with no logic branch.
- Manual verification: start the dev server, open the mint form for a VIN not yet registered, confirm the field reads "TÜV Car Inspection Wallet Address (recipient)" and the `Ü` renders correctly (no mojibake/encoding issue).
- No local Hardhat node interaction needed to verify this change.

## Risks and Rollback

- Risk: none functional; only risk is a text-encoding glitch with the `Ü` character in the source file (mitigated by visual check in task 2).
- Rollback: revert the single string literal change.

## Open Questions

None.
