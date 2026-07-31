---
name: product-roadmap-0029-0033
description: Five draft ADR+plan trios (0029-0033) drafted 2026-07-31 from a user product wishlist covering ownership history, structured vehicle records, transfers, escrow/marketplace, and notifications
metadata:
  type: project
  scope: contracts
---

On 2026-07-31 the user supplied a broad product wishlist for the VIN car-NFT (ownership/provenance, vehicle record, transactions, trust/verification, notifications). Asked how much to plan up front, the user chose **full ADR+frontend+contracts plan trios for every feature area now**, all still in `docs/plans/draft/` — none approved or implemented yet. Numbered sequentially onto the existing ADR/plan series (last used number before this was 0028, per [[vincidregistry-uups-proxy]]):

- **0029 — Ownership history + public VIN lookup + proof-of-ownership.** No contract change (`Transfer`'s `tokenId` is already indexed). Adds `react-router-dom` to the frontend for the first time, plus a read-only-RPC public `/lookup/:vin` route. Foundational — 0032's marketplace page reuses this router; 0030's vehicle-record UI extends this same public page.
- **0030 — Structured vehicle record.** The big one: replaces single-CID-per-VIN with an append-only `VehicleRecordEntry[]` (types `SERVICE`/`DOCUMENT`/`DAMAGE_FLAG`), a new `verifiers` role (excludes minter/owner) gating damage flags, and tightens `storeCid`'s currently-**fully-open** update access control (a real pre-existing gap found while designing this, not previously known/tracked elsewhere). Ships as a UUPS upgrade — first real (non-no-op) exercise of `npm run upgrade:sepolia` since ADR 0028's bootstrap.
- **0031 — Simple in-app transfer.** Just calls the already-inherited `safeTransferFrom` directly. No contract change. Trust-required (no payment coupling) — that gap is deliberately left to 0032.
- **0032 — Escrow + marketplace.** New standalone, **non-upgradeable** `CarSaleEscrow` contract (pull-payment, `nonReentrant`), mirroring `CarRewardToken`'s stay-separate precedent. Highest risk in this roadmap — the only contract holding funds in flight. `VinCidRegistry` itself untouched.
- **0033 — In-app notifications.** No contract change. Client-computed only (no backend, no email/push) — deliberately deferred; a previous owner who never reconnects their wallet will never see a transfer alert under this design. Service-reminder half depends on 0030 shipping first.

**Sequencing dependencies:** 0030 depends on 0028 (upgrade path) already being live — it is. 0032's marketplace page and 0029's public page share the new router. 0033 splits into a transfer-alert half (needs only 0029) and a service-reminder half (needs 0030).

**How to apply:** these are all `draft` status — do not treat any of this as implemented. Before recommending or building against any of it, check the actual `Status:` frontmatter in `docs/plans/draft/00{29,30,31,32,33}-*.md` and `docs/adr/00{29,30,31,32,33}-*.md`, since status may have moved on (approved/in-progress/rejected) since this memory was written. See `docs/decisions/2026-07-31-004` through `-008` for the per-ADR "chosen option" rationale.
