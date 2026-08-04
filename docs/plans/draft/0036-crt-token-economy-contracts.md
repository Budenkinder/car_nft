# Plan 0036 — CRT token economy — Contracts

- **ADR:** `docs/adr/0036-crt-token-economy.md`
- **Paired plan:** `docs/plans/draft/0036-crt-token-economy-frontend.md`
- **Status:** draft
- **Date:** 2026-08-03

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

> ⚠️ **This plan is a sketch, not an implementable checklist.** ADR 0036 is blocked on decision **D1** (real vs. soft paywall) and no option has been chosen. The task list below is deliberately shallow and split by branch; it must be rewritten into concrete tasks once D1 is answered. Do not implement from this file.

## Scope and Goals

Turn CRT from a one-directional mint reward into a closed loop: readers spend CRT to look up a VIN's details, those fees refill the pool that pays mint rewards, and a primary market lets readers acquire CRT in the first place.

The shape of the contract work depends entirely on D1:

- **Real paywall** — metadata is encrypted; a paid, non-`view` `unlockVin` call is the access record, and the decryption key is released off-chain against it. `CidStored` must stop carrying `cid`; the public getters must go.
- **Soft paywall** — a paid `unlockVin` call that records payment and emits an event, with the data still publicly readable. Perhaps a tenth of the work, and none of the breakage.

Out of scope in both branches: changing who may write (that is ADR 0035), and anything touching `ORG_ROLE`.

## Files to Add / Modify (provisional)

| Path | Action | Notes |
|------|--------|-------|
| `contracts/car_nft_sc.sol` | modify | `readFee`, `unlockVin(vin)`, fee routing, owner setters; **real branch only:** remove public getters, drop `cid` from `CidStored` |
| `contracts/car_reward_token.sol` | modify | primary market — `payable` purchase at a fixed rate (D3) |
| `test/…` | add | fee accounting, pool refill, exemptions, purchase path |
| `scripts/deploy.js` | modify | initial `readFee` / purchase rate configuration |

## Tasks (sketch — rewrite after D1)

**Both branches:**

- [ ] **A1.** Answer **D1**. Nothing below is implementable until this is settled.
- [ ] **A2.** Answer **D2** (fee destination: burn / pool / split with the authoring org), **D3** (how readers buy CRT), **D4** (fee and reward amounts, and that both become Safe transactions under ADR 0035), **D5** (does the car's own NFT owner read free?).
- [ ] **A3.** Add `readFee` storage plus an owner setter, appended per ADR 0028's discipline — new sequential state means shrinking `__gap` to match.
- [ ] **A4.** Add `unlockVin(string vin)`: pull `readFee` CRT from the caller (`transferFrom`, so the reader must `approve` first — a two-transaction UX the frontend plan has to absorb), route it per D2, emit `VinUnlocked(vin, reader)`.
- [ ] **A5.** Decide and implement the exemption set from D5 (at minimum the token owner; possibly `ORG_ROLE` holders reading records they authored).
- [ ] **A6.** Primary market per D3 — most likely a `payable` mint on `CarRewardToken` at a fixed ETH rate, owner-settable.
- [ ] **A7.** Tests: fee is charged exactly once per unlock; pool balance rises by the fee; exempt callers pay nothing; a caller with insufficient CRT or allowance reverts cleanly; the purchase path mints the right amount.
- [ ] **A8.** Model the loop before shipping: at chosen `readFee`/`rewardAmount`, how many reads per mint keep the pool non-decreasing? Write the number into the ADR. If the ratio needs more than a handful of reads per mint, the economics do not work and the design should change, not the parameters.

**Real-paywall branch only:**

- [ ] **B1.** Remove `getCidByVin`, `getAllVins`, `getAllCidsAsList`, and drop `cid` from `CidStored` — otherwise the paywall is decorative. **This breaks ADR 0027's shipped provenance feature**, which reconstructs history from exactly that event field; plan its replacement in the same change or knowingly regress it.
- [ ] **B2.** Confirm what `tokenURI` may return once metadata is encrypted. It cannot be removed (ERC-721), so it points at ciphertext — decide whether that is acceptable for the NFT to remain interpretable by wallets and marketplaces. It will look broken in OpenSea-style viewers.
- [ ] **B3.** Choose the key-management scheme (threshold network vs. key server) and record it as its own ADR — it is a larger decision than this plan, and a key server contradicts this project's no-backend stance.
- [ ] **B4.** Reconcile with ADR 0029 (issue #35), whose free public VIN lookup is the direct opposite of pay-to-read. One of them must be rewritten or dropped; that is a product call for the user.

## Contract Surface (provisional)

- **New:** `readFee` (storage), `setReadFee` (owner/Safe), `unlockVin(string)`, `event VinUnlocked(string vin, address reader)`; purchase function on CRT.
- **Removed, real branch only:** three public getters; `cid` from `CidStored`.
- **Storage:** first change since ADR 0028 to add sequential state — `__gap` shrinks from `uint256[50]` to `[49]`. Must land in the same upgrade discipline and be layout-tested.
- **Access control:** unchanged; `unlockVin` is open to anyone able to pay.

## Interfaces with Frontend

`unlockVin` requires an ERC-20 `approve` first, so every read becomes approve-then-call — two wallet prompts before a user sees anything. That is the dominant UX cost of this ADR and belongs in the frontend plan's risk section, not as a footnote.

## Testing

Hardhat unit tests per A7, plus the economic model in A8 (arithmetic, not a test). Security: reentrancy on the fee path (CRT is a known-good ERC-20, but `unlockVin` moves tokens and must follow checks-effects-interactions like `storeCid` does); allowance griefing; fee-on-transfer assumptions (CRT has none — assert it).

## Deployment and Migration

Upgrade behind the existing proxy, same path as ADR 0035, which must ship first. The real-paywall branch additionally needs every already-pinned metadata JSON re-pinned in encrypted form, or the paywall applies only to new records — a migration question with no good answer, since old CIDs are already public forever.

## Risks and Rollback

- **The economics may not close.** If reads per mint are lower than A8's break-even, the pool drains faster with a paywall than without, because reads are rare and mints are subsidized.
- **A real paywall breaks shipped and queued features** (ADR 0027, ADR 0029) and makes the NFT opaque to standard viewers.
- **Regulatory exposure:** selling a token that buys access to a service invites consumer/financial-regulation questions this project has not faced. Flagged, not assessed.
- **Rollback:** `readFee = 0` disables the economy without an upgrade in either branch. The real branch's removals are not reversible in the same cheap way — deleted events and getters would need another upgrade, and data already public stays public.

## Open Questions

All of D1-D5 (see ADR 0036). D1 blocks everything.
