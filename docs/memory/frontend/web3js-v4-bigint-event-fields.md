---
name: web3js-v4-bigint-event-fields
description: web3.js v4 returns event blockNumber/logIndex as BigInt — sorting or subtracting them directly throws "Cannot convert a BigInt value to a number".
metadata:
  type: project
  scope: frontend
---

`web3.eth.Contract.getPastEvents(...)` (web3.js v4, this project's version — see [[web3js-contract-access-pattern]]) returns each event's `blockNumber` and `logIndex` as native `BigInt`, not `Number`. Using them directly in arithmetic a sort comparator relies on — `(a, b) => a.blockNumber - b.blockNumber` — throws `TypeError: Cannot convert a BigInt value to a number` as soon as two events are on different blocks, because the engine's numeric coercion of the comparator's return value rejects a `BigInt` result.

**Why this is easy to miss:** the failure only shows up once there are ≥2 events to compare (a single-event list never calls the comparator), and the calling code's own `try/catch` silently swallows it — the feature just returns an empty result with no visible error, unless you specifically check the console/log output (`netLog.error`).

**Found:** implementing `getOrgRoleHolders` (ADR 0035) — it always reported zero approved organizations, even for a wallet the contract confirmed held `ORG_ROLE`. See `docs/decisions/2026-08-04-006-fix-bigint-sort-crash-in-org-role-holders.md`. `getTransactionHistoryForVin` in the same file already avoided this correctly by mapping `blockNumber: Number(event.blockNumber)` before sorting — the convention this bug should have followed from the start.

**How to apply:** whenever sorting or doing arithmetic on `blockNumber`/`logIndex` (or any other field) from a web3.js event object, wrap it in `Number(...)` first: `Number(a.blockNumber) - Number(b.blockNumber)`. Test with ≥2 events spanning different blocks — a single-event fixture won't catch this.
