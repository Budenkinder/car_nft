---
date: 2026-07-31
scope: both
status: proposed
related_adr: 0030-structured-vehicle-record
supersedes: none
---

# Adopt an append-only typed vehicle-record array with a separate verifier role, over relying on event reconstruction alone

## Context

Designing the "vehicle record" part of the user's wishlist (service log, mileage snapshots, document attachments, permanent damage flags) surfaced that `storeCid`'s update path is currently fully open to any caller (per its own code comment) — a real gap for anything claiming to be "tamper-resistant," and specifically incompatible with "damage flagging that can't be hidden by a shady seller," since today's owner could simply overwrite records themselves.

## Decision

Add a new append-only `VehicleRecordEntry[]` per VIN with a typed `EntryType` (`SERVICE`/`DOCUMENT`/`DAMAGE_FLAG`), gate `SERVICE`/`DOCUMENT` entries to the minter or current NFT owner, gate `DAMAGE_FLAG` entries to a new `verifiers` role that explicitly excludes both the minter and the current owner, and tighten `storeCid`'s previously-open update path to match. Ships as a UUPS upgrade (ADR 0028), not a redeploy.

## Alternatives Considered

- Keep one CID per VIN, rely purely on ADR 0027's event reconstruction for "history" — rejected; doesn't fix the open-update gap and has no way to represent or gate a damage flag as categorically different from a routine update.
- Store the structured record only off-chain (metadata JSON convention, no new on-chain entries) — rejected; access control can only be enforced on-chain, so this doesn't actually stop a dishonest party from fabricating a convincing-looking entry, or stop an owner from simply never creating a damage-flag JSON.

## Consequences

- Fixes a real pre-existing vulnerability (`storeCid` was callable by anyone) as a bundled part of this change, not a separate silent fix.
- Introduces a new centralized `verifiers` allow-list managed by `owner()` — who actually qualifies as a verifier at rollout is a business decision left open in the ADR, not resolved by this contract change.
- First real (non-no-op) exercise of the Sepolia upgrade path built in ADR 0028.
