---
date: 2026-08-02
scope: both
status: accepted
related_adr: 0027-nft-transaction-provenance-link
supersedes: 2026-07-29-011-plan-0027-manual-test-deferred-to-post-merge.md
---

# Plan 0027 transitioned in-progress → done; ADR 0027 bumped proposed → accepted; issue #42 closed

## Context

All five frontend tasks of plan 0027 (per-VIN transaction history reconstructed from `CidStored` events, Etherscan-linked) were implemented on 2026-07-28/29, including the chunked `eth_getLogs` fix and the backfilled Sepolia `deployedAtBlock` (`2026-07-29-010`). The contracts side was a no-op apart from `scripts/deploy.js` recording `deployedAtBlock`.

One thing held the plan open: decision `2026-07-29-011` deferred the browser + MetaMask verification to after the `dev` → `main` merge, and the plan's Testing section explicitly said *"do not move to `done` on implementation completeness alone"*. On 2026-08-02 the user reported: *"verification done."*

## Decision

Treat the user's confirmation as satisfying the hold, and complete the transition: `git mv` both plan files to `docs/plans/done/`, set `Status: done`, rewrite the paired-plan paths and ADR 0027's `Related plans:`, bump ADR 0027 from `proposed` to `accepted` (the `2026-07-31-001` precedent), and close [#42](https://github.com/Budenkinder/car_nft/issues/42) per `CLAUDE.md` §2a step 7.

Recorded honestly in the plan's Testing section: the user ran checks (a)-(c) themselves and relayed no per-step results or screenshots, so the record states that this rests on their confirmation rather than on assistant-observed output. No verification claim is made here beyond what was actually reported.

This supersedes `2026-07-29-011`, the deferral it discharges.

## Alternatives Considered

- **Accept the confirmation and close out** *(chosen)* — the hold was defined as "user confirms after merge", and the user confirmed. Asking them to re-report per-step detail would second-guess a direct statement about work only they can perform.
- **Ask which of (a), (b), (c) were run, and on which branch/environment** — rejected as a blocker, but the ambiguity is noted: "verification done" does not itself say whether the `dev` → `main` merge happened first, which was the premise of the original deferral. Raised with the user in the same turn instead of gating the transition on it.
- **Keep the plan `in-progress` until the merge is independently confirmed** — rejected: the folder would then contradict the user's own report of the state of the work.

## Consequences

- **Positive:** `docs/plans/in-progress/` is empty; every trio in the repo is now in a terminal folder or `approved/`. The provenance feature is recorded as shipped, and its ADR is accepted.
- **Negative / accepted costs:** `done/` records a completion resting on a one-line user report rather than reproducible evidence — normal for wallet/browser flows in this repo, and the plan says so plainly rather than implying more.
- **Follow-ups required:** the plan's one open question survives the transition and is now unowned by any issue — whether "Show All Registered NFTs" should carry a per-row tx link (needs one event query per row, or one full-range query filtered client-side). If wanted, that is a new ADR + trio, not a reopen of 0027. Also unchanged: the scanned range grows ~7,200 blocks/day from whatever `deployedAtBlock` is set to, and the chunk count with it — correctness-neutral, with ADR 0027 Option B (indexed events + redeploy) as the eventual escalation path. Note the plan text's `11371335` is the *pre-proxy* registry's backfilled block; the current live value is `11385148` (the UUPS proxy bootstrap of 2026-07-30), which the user set in Vercel on 2026-07-31 per `2026-07-31-002`. The plan file was left as written — it is an accurate record of what was true when the work was done.
