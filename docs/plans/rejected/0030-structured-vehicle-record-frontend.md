# Plan 0030 — Structured vehicle record — Frontend

- **ADR:** `docs/adr/0030-structured-vehicle-record.md`
- **Paired plan:** `docs/plans/rejected/0030-structured-vehicle-record-contracts.md`
- **GitHub Issue:** [#36](https://github.com/Budenkinder/car_nft/issues/36)
- **Status:** rejected
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add UI for adding/viewing service entries, document attachments, and (for verifiers) damage flags; render a mileage-over-time series; extend the ADR 0029 public lookup page with this data. Depends on the paired contracts plan shipping first (new functions/events don't exist until then). Out of scope: escrow/marketplace, notifications.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/utils/pinata_ipfs_nft_service.js` | modify | Add `addServiceEntry`, `addDocumentEntry`, `addDamageFlag`, `getRecordEntries`, `pinDocument` (pins a raw file, then a small wrapping JSON `{docType, fileCid, fileName, notes}`, mirroring the existing metadata-pin pattern). Add `isVerifier(address, chainId)` read. |
| `frontend/src/components/VehicleRecordPanel.js` | add | Renders `getRecordEntries` as a timeline (service/document/damage-flag icons), a mileage line chart from `SERVICE`/`DAMAGE_FLAG` entries' `mileage` field, and document download links. Used by both the main app and the public lookup page. |
| `frontend/src/components/AddRecordEntryForm.js` | add | Form for adding a service/document entry (shown to minter or the loaded VIN's owner) and a separate damage-flag form (shown only if `isVerifier` is true for the connected wallet). |
| `frontend/src/pages/PublicLookupPage.js` | modify | Render `VehicleRecordPanel` (read-only) alongside the existing owner/history sections from ADR 0029. |
| `frontend/src/App.js` | modify | Render `VehicleRecordPanel` + `AddRecordEntryForm` in the "Load Car NFT" result view. |

## Tasks

- [ ] **1.** Add the new contract-call functions to `pinata_ipfs_nft_service.js`, following the existing `storeCidOnBlockchain` pattern (gas estimate with buffer, structured `txLog` calls, receipt handling).
- [ ] **2.** Add `pinDocument`: uploads a raw file to Pinata, then pins a small wrapping metadata JSON referencing it, returning the wrapping JSON's CID for use with `addDocumentEntry`.
- [ ] **3.** Add `frontend/src/components/VehicleRecordPanel.js`: fetches `getRecordEntries`, renders a chronological timeline with per-type styling, a mileage chart, and document links (fetching each `DOCUMENT` entry's wrapping JSON to get `fileCid`/`fileName`).
- [ ] **4.** Add `frontend/src/components/AddRecordEntryForm.js`: service/document sub-form gated on `minter` or current-owner match; damage-flag sub-form gated on `isVerifier`; both call the new task-1 functions and surface tx status the same way `handleSubmit` already does for `storeCid`.
- [ ] **5.** Wire `VehicleRecordPanel` + `AddRecordEntryForm` into `App.js`'s loaded-VIN view.
- [ ] **6.** Wire read-only `VehicleRecordPanel` into `PublicLookupPage.js` from ADR 0029.

## Interfaces with Contracts

- Functions called: `addServiceEntry(vin, cid, mileage)`, `addDocumentEntry(vin, cid)`, `addDamageFlag(vin, cid, mileage)`, `getRecordEntries(vin)`, `verifiers(address)` (public mapping getter) — all new, from the paired contracts plan.
- Events consumed: `RecordEntryAdded(vin, entryType, cid, mileage, submitter)` — used to refresh `VehicleRecordPanel` after a successful write without a full page reload.
- ABI / address handoff: standard — `contract_abi.json` re-synced by `scripts/upgrade.js` per the contracts plan; no address change.
- Network assumptions: unchanged.

## Testing

- No new unit tests (matches existing project convention of manual verification for contract-call utilities).
- Manual verification: as minter, add a service entry to a VIN; as the VIN's current owner (different wallet), add a document entry; as a non-verifier, confirm the damage-flag form is hidden/disabled; as a `setVerifier`-authorized address, add a damage flag and confirm it appears and cannot be edited/removed from the UI (no such action exists). Confirm the public lookup page renders the same data without a wallet connected.
- How to verify against local Hardhat: after the paired contracts plan's `npm run upgrade:local`, exercise the full flow above against `localhost`.

## Risks and Rollback

- Risk: `AddRecordEntryForm`'s role gating is a UI convenience only — the contract enforces the real access control, so a hidden form is not a security boundary; document this clearly in the component so it isn't mistaken for one.
- Risk: document uploads (potentially larger files than the existing JSON-only metadata) may hit Pinata size/rate limits sooner — flag if this becomes an issue, no mitigation planned preemptively.
- Rollback: additive UI; hiding the new panel/forms fully reverts to pre-0030 behavior with no data loss (contract-side entries remain, just unrendered).

## Open Questions

- Should document entries support multiple files per entry (e.g. a multi-page inspection report), or one file per `addDocumentEntry` call (simplest, chosen by default unless the user wants otherwise)?
