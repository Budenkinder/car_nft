# ADR 0030: Replace single-CID-per-VIN with an append-only structured vehicle record (service log, mileage, documents, permanent damage flags)

- **Status:** proposed
- **Date:** 2026-07-31
- **Scope:** both
- **Related plans:**
  - `docs/plans/draft/0030-structured-vehicle-record-frontend.md`
  - `docs/plans/draft/0030-structured-vehicle-record-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-31-005-vehicle-record-entries-chosen.md`

## Context

The user's wishlist asked for a service/maintenance log, mileage snapshots over time with some tamper-resistance, document attachments (registration/insurance/inspection), and permanent damage/accident flagging that a shady seller can't hide.

Today, `vinToCid: mapping(string => string)` stores exactly **one** CID per VIN — the latest metadata JSON pinned via Pinata (containing `vin`, `make`, `model`, `year`, `mileage`, `issueDescription`, `repairShop` — see `frontend/src/utils/validation.js` and `App.js:124`). Every `storeCid` call, mint or update, overwrites this single value. Two things follow from that:

1. **History already partially exists but is hidden.** ADR 0027 already reconstructs every historical CID for a VIN from `CidStored` events. Each of those CIDs is still a fully-formed metadata JSON with its own mileage/issue/shop fields, still pinned on IPFS, still content-addressed (so it's immutable and independently verifiable) — the frontend just doesn't fetch and display them yet. Mileage-over-time is therefore *already* reasonably tamper-evident (you cannot alter a past IPFS-pinned JSON without changing its CID, and the CID is permanently anchored by an immutable on-chain event) — the real gaps are (a) no UI surfaces this series, (b) no structured `entryType` to distinguish a routine service update from a document from a damage flag, and (c) **updates are currently unrestricted** (`storeCid`'s code comment: "Updates to an existing record are open in this POC build" — literally anyone, not just the minter or the car's owner, can overwrite a VIN's CID today). That last point undermines "tamper-resistant" on its own: a shady seller could push a fabricated low-mileage update themselves.
2. **Damage/accident flagging needs a party who isn't the seller.** If only the minter (registry operator) or the current NFT owner could write records, an owner could simply never log an accident. "Can't be hidden by a shady seller" requires a role that is *not* the vehicle's current owner and not revocable by them.

## Decision

Add an append-only, typed vehicle-record history behind the existing UUPS proxy (ADR 0028 exists specifically so this kind of additive storage change ships as an upgrade, not a redeploy):

- New `enum EntryType { SERVICE, DOCUMENT, DAMAGE_FLAG }` and `struct VehicleRecordEntry { EntryType entryType; string cid; uint256 mileage; uint256 timestamp; address submitter; }`, stored in a new `mapping(string => VehicleRecordEntry[]) private vinRecords;`, appended after the existing `__gap` (shrunk from `uint256[50]` to `uint256[49]`) per ADR 0028's append-only discipline. Entries are never edited or deleted by any function — "permanent" is enforced by the absence of a mutating function, not by a flag.
- `addServiceEntry(vin, cid, mileage)` and `addDocumentEntry(vin, cid)`: callable by `minter` **or** the VIN's current NFT owner (self-service logging, matching how a real owner logs their own oil changes).
- `addDamageFlag(vin, cid, mileage)`: callable **only** by a new `verifiers` role (`mapping(address => bool) public verifiers`, managed by `owner()` via `setVerifier(address, bool)`) — deliberately excludes both `minter` and the current NFT owner, so the party incentivized to hide damage cannot also clear or suppress it.
- `storeCid`'s access control is tightened to match `addServiceEntry`/`addDocumentEntry` (minter or current owner) — closing the existing fully-open-update hole discovered while designing this ADR. This is called out explicitly as a fix bundled into this change, not a separate silent decision.
- `getRecordEntries(vin) external view returns (VehicleRecordEntry[] memory)` and a new `RecordEntryAdded(string vin, uint8 entryType, string cid, uint256 mileage, address submitter)` event for frontend consumption/indexing.
- Documents (registration/insurance/inspection) reuse the existing metadata-JSON-on-IPFS pattern rather than inventing a second convention: `cid` on a `DOCUMENT` entry points to a small JSON (`{ docType, fileCid, fileName, notes }`) whose `fileCid` is the actual pinned file — consistent with how `fetchNFTMetadata` already works for the primary CID.

## Options Considered

### Option A — Append-only typed entries array behind the existing proxy, new `verifiers` role (chosen)
- **Pros:** Reuses ADR 0028's upgrade path exactly as intended (append-only storage change, no redeploy); "permanent" damage flags are structurally permanent (no delete/edit function exists) rather than policy-permanent; separates who can self-report routine service (owner/minter) from who can flag damage (independent verifier), directly answering the "can't be hidden by a shady seller" requirement; closes a real, pre-existing access-control gap (`storeCid` was fully open) as part of the same change.
- **Cons:** Meaningfully larger contract surface (new enum/struct/mapping/role/four functions); `verifiers` is a new centralized-trust role — the registry owner decides who counts as a verifier, which is itself a policy/business decision outside this ADR's scope (who qualifies as an inspector is not a smart-contract question).

### Option B — Keep one CID per VIN; represent "history" purely by continuing to rely on ADR 0027's event reconstruction, no new entry types
- **Pros:** Zero contract change, ships as a pure frontend feature (fetch and render each historical CID's metadata).
- **Cons:** Does not solve the two real gaps: `storeCid` stays fully open (no tamper-resistance against a malicious self-update), and there is no way to represent a `DAMAGE_FLAG` as categorically different from a routine update, nor to restrict who can add one — a seller could still just never call it, and nothing distinguishes "an oil change" from "an accident" in the data model. Rejected as insufficient for the stated requirement.

### Option C — Store the full structured record off-chain (e.g. only in the metadata JSON, no new on-chain entries) and treat the single `CidStored` event per update as the only on-chain anchor
- **Pros:** Simplest possible contract, no new state at all.
- **Cons:** Loses the ability to enforce *who* can add a damage flag — access control can only live on-chain; an off-chain JSON schema convention is trivially bypassable by anyone pinning their own "damage flag" JSON that looks the same. Does not satisfy "permanent... can't be hidden," since there's no on-chain gate stopping the very party incentivized to hide it from simply not creating that JSON, or from a dishonest party fabricating one that looks legitimate. Rejected.

## Consequences

- **Positive:** Service history, mileage-over-time, document attachments, and damage flags all become first-class, queryable, permanently-appended on-chain data with role-appropriate write access. Fixes a real pre-existing vulnerability (`storeCid` was callable by anyone).
- **Negative / accepted costs:** Larger contract surface increases audit/testing burden; `verifiers` is a centralized allow-list the `owner()` manages manually — no on-chain governance over who becomes a verifier, mirroring this project's existing single-owner trust model (`Ownable`) rather than introducing new complexity disproportionate to a POC.
- **Frontend impact:** New forms for adding service/document/damage-flag entries (gated by role, mirrored in the UI); the public lookup page from ADR 0029 gains a service-history/mileage-chart/documents section; existing "Load Car NFT" flow gains the same.
- **Contracts impact:** New enum/struct/mapping appended after `__gap`; four new functions; `storeCid`'s access control changes (breaking behavior change for any caller other than minter/owner — acceptable since the project has no other callers today, but must ship via `npm run upgrade:sepolia`, the first real exercise of that path since ADR 0028's bootstrap).
- **Follow-ups:** ADR 0029's public page should be extended to render this data once implemented. Who is authorized as a `verifier` (an actual inspector, a partner dealership, the registry operator themselves) is a business decision for the user to make at rollout time, not resolved by this ADR.

## References

- `contracts/car_nft_sc.sol:16-18,49-81` (`vinToCid`, `storeCid`, the currently-open update access control).
- `docs/adr/0028-vin-registry-uups-proxy.md` (the append-only `__gap` discipline this change follows).
- `docs/adr/0027-nft-transaction-provenance-link.md` (the existing event-history precedent this extends with typed entries and per-type access control).
- `frontend/src/utils/validation.js`, `frontend/src/App.js:124` (existing metadata JSON schema: `vin`/`make`/`model`/`year`/`mileage`/`issueDescription`/`repairShop`).
