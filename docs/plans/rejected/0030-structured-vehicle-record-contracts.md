# Plan 0030 — Structured vehicle record — Contracts

- **ADR:** `docs/adr/0030-structured-vehicle-record.md`
- **Paired plan:** `docs/plans/rejected/0030-structured-vehicle-record-frontend.md`
- **GitHub Issue:** [#36](https://github.com/Budenkinder/car_nft/issues/36)
- **Status:** rejected
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add an append-only, typed vehicle-record history to `VinCidRegistry` (service entries, document entries, permanent damage flags), a new `verifiers` role gating damage flags, and tighten `storeCid`'s access control to close its current fully-open-update hole. Ships as a UUPS upgrade (ADR 0028), not a redeploy. Out of scope: any UI, and any decision about *who* becomes a verifier (business/ops decision, not a contract concern).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `contracts/car_nft_sc.sol` | modify | Add `EntryType` enum, `VehicleRecordEntry` struct, `vinRecords` mapping (appended after `__gap`, gap shrunk `50 → 49`), `verifiers` mapping, `setVerifier`, `addServiceEntry`, `addDocumentEntry`, `addDamageFlag`, `getRecordEntries`, `RecordEntryAdded` and `VerifierChanged` events. Tighten `storeCid`'s update-path access control to `minter` or current NFT owner. |
| `test/VinCidRegistry.recordEntries.test.js` | add | New suite covering entry addition, access control per entry type, append-only/no-delete guarantee, and the `storeCid` access-control tightening. |
| `test/VinCidRegistry.upgrade.test.js` | modify | Extend the existing upgrade-safety assertions to also cover that pre-upgrade `vinRecords`/`verifiers` state (once this ships) survives a subsequent upgrade, following the same pattern already used for `vinToCid`/`rewardAmount`/`minter`. |
| `contracts/mocks/VinCidRegistryV2Mock.sol` | modify | Extend to also mirror the new storage fields, so the existing upgrade-safety test continues to prove full-contract storage-layout safety, not just the pre-0030 subset. |

## Tasks

- [ ] **1.** Add `EntryType`/`VehicleRecordEntry`/`vinRecords`/`verifiers` state and `RecordEntryAdded`/`VerifierChanged` events to `contracts/car_nft_sc.sol`, appended after `__gap` per ADR 0028's discipline (shrink `__gap` from `uint256[50]` to `uint256[49]`).
- [ ] **2.** Implement `setVerifier(address account, bool authorized) external onlyOwner`.
- [ ] **3.** Implement `addServiceEntry(string vin, string cid, uint256 mileage)` and `addDocumentEntry(string vin, string cid)`, both requiring `msg.sender == minter || msg.sender == ownerOf(_tokenIdFromVin(vin))`, appending to `vinRecords[vin]` and emitting `RecordEntryAdded`.
- [ ] **4.** Implement `addDamageFlag(string vin, string cid, uint256 mileage)`, requiring `verifiers[msg.sender]`, appending an `EntryType.DAMAGE_FLAG` entry — no corresponding remove/edit function is ever added.
- [ ] **5.** Implement `getRecordEntries(string vin) external view returns (VehicleRecordEntry[] memory)`.
- [ ] **6.** Tighten `storeCid`'s update branch (the non-mint path) to require `msg.sender == minter || msg.sender == ownerOf(tokenId)`, matching task 3's gating; add a code comment explaining this closes a previously-open POC gap.
- [ ] **7.** Extend `contracts/mocks/VinCidRegistryV2Mock.sol` to mirror the new fields/functions so the upgrade test suite still proves full storage-layout safety.
- [ ] **8.** Write `test/VinCidRegistry.recordEntries.test.js`: service/document entries by minter and by owner succeed; by an unrelated address revert; damage flags by a verifier succeed; by minter/owner/anyone-else revert; entries are append-only (assert array length only grows, no entry's fields ever change); `getRecordEntries` returns entries in insertion order.
- [ ] **9.** Update `test/VinCidRegistry.test.js`'s existing `storeCid` update-path tests for the new access control (previously-passing "anyone can update" cases become revert cases).
- [ ] **10.** Extend `test/VinCidRegistry.upgrade.test.js` to assert `vinRecords`/`verifiers` state survives an upgrade.
- [ ] **11.** Run `npm run upgrade:local` against a `localhost` node with pre-existing entries; confirm entries and verifier assignments survive; this is the first real exercise of the upgrade path with an actual behavioral (not just additive-no-op) implementation change.

## Contract Surface

- **Added:** `enum EntryType { SERVICE, DOCUMENT, DAMAGE_FLAG }`; `struct VehicleRecordEntry { EntryType entryType; string cid; uint256 mileage; uint256 timestamp; address submitter; }`; `mapping(string => VehicleRecordEntry[]) private vinRecords`; `mapping(address => bool) public verifiers`.
- **Added functions:** `setVerifier(address, bool) external onlyOwner`; `addServiceEntry(string, string, uint256) external`; `addDocumentEntry(string, string) external`; `addDamageFlag(string, string, uint256) external`; `getRecordEntries(string) external view returns (VehicleRecordEntry[] memory)`.
- **Added events:** `RecordEntryAdded(string vin, uint8 entryType, string cid, uint256 mileage, address submitter)`; `VerifierChanged(address indexed verifier, bool authorized)`.
- **Changed access control:** `storeCid`'s update path (existing NFT, not a new mint) now requires `minter` or the current NFT owner — previously unrestricted. Mint path unchanged (`minter`-only).
- **Storage layout:** `__gap` shrinks from `uint256[50]` to `uint256[49]`; `vinRecords` and `verifiers` occupy the freed slot and a new one, per ADR 0028's append-only rule. No existing field is reordered or removed.
- **Access control summary:** mint — `minter` only (unchanged). Update primary CID / add service / add document — `minter` or current NFT owner. Add damage flag — `verifiers[msg.sender]` only, explicitly excluding `minter` and the NFT owner. Verifier management — `owner()` only.
- **Gas considerations:** each `VehicleRecordEntry` append costs a new dynamic-array slot write (~20k gas for a new slot, standard Solidity dynamic array append cost) — flat per entry, unaffected by how many entries already exist. `getRecordEntries` is unbounded in the number of entries returned; acceptable at this project's scale, would need pagination if any VIN accumulates very large history (unlikely for a single vehicle's service log).

## Interfaces with Frontend

- ABI: re-synced automatically by `scripts/upgrade.js` (already handles this per ADR 0028) once this ships as an upgrade.
- Address: unchanged — this ships via `npm run upgrade:sepolia`, not a new bootstrap; the proxy address stays the same.
- New event `RecordEntryAdded` is the frontend's signal for a new entry; new view `getRecordEntries` is the read path.

## Testing

- `test/VinCidRegistry.recordEntries.test.js` (new): access control per entry type; append-only guarantee; event emission; `getRecordEntries` ordering.
- `test/VinCidRegistry.upgrade.test.js` (extended): new state survives an upgrade from a pre-0030 implementation.
- `test/VinCidRegistry.test.js` (updated): `storeCid` update-path access-control change.
- Security checks: confirm a non-verifier (including the minter and the car's own owner) cannot call `addDamageFlag`; confirm there is no function anywhere that can remove or mutate an existing `VehicleRecordEntry`; confirm `setVerifier` is `onlyOwner`.

## Deployment and Migration

- Ships as an upgrade (`npm run upgrade:local` then `npm run upgrade:sepolia`) — no new proxy, no new `CarRewardToken`, no frontend address change, per ADR 0028's model. This is the first real (non-no-op) exercise of the Sepolia upgrade path.
- No data migration needed — `vinRecords`/`verifiers` start empty for all existing VINs; nothing to backfill.
- Verification on Etherscan: re-verify the new implementation contract after the upgrade.

## Risks and Rollback

- Risk: the `storeCid` access-control tightening is a breaking behavior change — anything currently relying on open updates (nothing known today, but worth stating) would start reverting. Mitigated by this being called out explicitly in the ADR and this plan, not a silent side effect.
- Risk: incorrect storage-gap arithmetic corrupts layout on upgrade — mitigated by the extended upgrade test (task 10) and the existing storage-gap discipline from ADR 0028.
- Risk: an over-broad `verifiers` allow-list (the `owner()` adding an untrustworthy address) undermines the "can't be hidden by a shady seller" goal at the human-process level, not the contract level — out of scope for this ADR to solve (a policy/business decision), but worth flagging to the user before rollout.
- Rollback: upgrade back to the pre-0030 implementation address (kept in `deployments/<network>.json` history) if needed — existing `vinRecords`/`verifiers` state would simply become unreachable (not deleted), consistent with the append-only-storage rollback pattern already documented in ADR 0028.

## Open Questions

- Who is authorized as a `verifier` at rollout (an actual inspector/dealer partner, or initially just the registry operator)? Business decision for the user, not resolved here.
