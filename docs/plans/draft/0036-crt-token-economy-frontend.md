# Plan 0036 — CRT token economy — Frontend

- **ADR:** `docs/adr/0036-crt-token-economy.md`
- **Paired plan:** `docs/plans/draft/0036-crt-token-economy-contracts.md`
- **Status:** draft
- **Date:** 2026-08-03

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

> ⚠️ **This plan is a sketch, not an implementable checklist.** ADR 0036 is blocked on decision **D1** (real vs. soft paywall). Do not implement from this file; rewrite it into concrete tasks once D1 is answered.

## Scope and Goals

Put the pay-to-read flow in front of users: show a CRT balance, gate VIN detail display behind payment, and provide a way to buy CRT. What "gate" means is decided by D1 — under a soft paywall the UI *is* the gate (and the data stays public underneath); under a real paywall the UI orchestrates payment and then decryption.

Out of scope: the organization application page and role gating (ADR 0035), and any change to who may write records.

## Files to Add / Modify (provisional)

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/components/CrtBalance.jsx` | add | balance display + buy entry point |
| `frontend/src/components/VinUnlockGate.jsx` | add | the paywall in front of VIN details |
| `frontend/src/utils/crt_service.js` | add | `balanceOf`, `approve`, `unlockVin`, purchase call |
| `frontend/src/App.js` | modify | wrap the detail views in the gate |
| `frontend/src/utils/pinata_ipfs_nft_service.js` | modify | **real branch only:** decrypt metadata after unlock |

## Tasks (sketch — rewrite after D1)

- [ ] **1.** Blocked on **D1** and **D3** (how a reader acquires CRT). Nothing below is implementable until both are settled.
- [ ] **2.** `crt_service.js`: read balance, check allowance, `approve`, call `unlockVin`. Follow the existing web3/service-layer pattern — all contract access funnels through the service layer, never from components.
- [ ] **3.** `CrtBalance.jsx`: show the connected wallet's CRT balance and a buy action wired to D3's purchase path.
- [ ] **4.** `VinUnlockGate.jsx`: before showing details, check whether this reader has unlocked this VIN; otherwise show price and an unlock action. **Two wallet prompts** — `approve` then `unlockVin` — unless an unlimited allowance is offered on first use (which users are right to distrust). This is the dominant UX cost of the whole ADR.
- [ ] **5.** Decide what "already unlocked" means client-side: re-reading `VinUnlocked` events per reader (an event query per view — see the chunking constraint in `docs/memory/frontend/event-queries-must-be-chunked.md`), or a contract mapping. Prefer the mapping; the event scan will not stay cheap.
- [ ] **6.** **Real branch only:** fetch the key after unlock and decrypt the metadata client-side. Cannot be specified until D1's key-management scheme (ADR 0036 B3) exists.
- [ ] **7.** Manual verification: unlock as a funded reader; attempt as an unfunded one; confirm exempt readers (D5 — at minimum the car's own NFT owner) are never charged.

## Interfaces with Contracts

- Calls: `readFee()`, `unlockVin(string)`, CRT `balanceOf`/`approve`/`allowance`, plus D3's purchase function.
- Events: `VinUnlocked(vin, reader)`.
- **Real branch only:** `getCidByVin` and the `cid` field of `CidStored` disappear, so every current read path in `pinata_ipfs_nft_service.js` must be reworked — including the provenance history shipped under ADR 0027.

## Testing

Manual, as with every wallet flow in this project. Error paths that matter: insufficient CRT; insufficient allowance; user rejects either prompt; unlock succeeds but the metadata fetch fails (the reader has paid and got nothing — needs a retry path that does not charge twice).

## Risks and Rollback

- **Two prompts per read** is a severe UX regression against a feature that is free today. Under a soft paywall, users pay that cost for protection that does not exist.
- **Paid-but-no-data** is the failure mode to design for first: any error after payment must be recoverable without a second charge.
- **The gate is cosmetic under a soft paywall.** UI copy must never imply the data is private; it is one Etherscan query away.
- **Rollback:** `readFee = 0` and removing the gate component restores current behavior in the soft branch. The real branch is not cheaply reversible — see the paired contracts plan.

## Open Questions

All of D1-D5 (ADR 0036). Additionally, frontend-specific: is an unlimited CRT allowance acceptable to avoid the double prompt, or must every read be individually approved?
