---
date: 2026-08-02
scope: both
status: superseded
related_adr: 0013-devcontainer-env-scaffolding
supersedes: 2026-07-23-002-plan-0013-draft-to-approved.md
---

# Plan 0013 (Dev Container `.env` scaffolding) rejected; issue #41 closed as not planned

## Context

Trio 0013 proposed `.devcontainer/setup.sh`, invoked from `postCreateCommand`, to idempotently copy `.env.example` → `.env` and `frontend/.env.example` → `frontend/.env.local` when those files are absent, so fresh Codespaces and container rebuilds stop failing silently with undefined config. It was approved on 2026-07-23 (`2026-07-23-002`) and sat in `docs/plans/approved/` unstarted for ten days. It had just been given a backfilled tracking issue, [#41](https://github.com/Budenkinder/car_nft/issues/41), under the new ADR 0034 rule (`2026-08-02-003`).

On 2026-08-02 the user instructed: *"Reject plan 0013."* **No reason was given.** `docs/plans/rejected/README.md` requires the rejection decision to capture *why*, so this record notes plainly that the rationale was not stated rather than inventing one. If a reason is supplied later, it belongs appended here, not rewritten over this text.

## Decision

Move both 0013 plan files from `docs/plans/approved/` to `docs/plans/rejected/` (`git mv`, both files tracked), set frontmatter `Status: rejected`, rewrite the paired-plan paths and ADR 0013's `Related plans:`, and close #41 with `--reason "not planned"` per `CLAUDE.md` §2a step 7 — the first close-as-not-planned under that rule.

**ADR 0013 stays `proposed`.** Per §2a and `rejected/README.md`, a rejected plan does not force the ADR's status; the combination "ADR proposed + plan rejected" is the documented way to record "we considered this and decided not to ship it". The ADR is preserved intact, options and all, so a future revival has the analysis available.

This decision `supersedes: 2026-07-23-002-plan-0013-draft-to-approved.md`, the approval it reverses; that file's status should be read as overridden by this one.

## Alternatives Considered

- **Reject the plan, leave the ADR `proposed`** *(chosen)* — exactly what the user asked for, and it matches the documented semantics for the pairing.
- **Also mark ADR 0013 `superseded`** — rejected: nothing supersedes it. No competing decision was made about Dev Container env scaffolding; the work was simply dropped. `superseded` would imply a replacement exists.
- **Move the trio back to `draft/` instead of `rejected/`** — rejected: "reject" is unambiguous, `rejected/` is the terminal state the folder scheme provides for it, and `draft/` would misrepresent shelved work as still under consideration.
- **Ask for the reason before acting** — rejected as blocking: the instruction is clear and every part of it is reversible. The missing rationale is recorded as a gap here and raised with the user instead.

## Consequences

- **Positive:** `docs/plans/approved/` is now empty (only its `README.md` remains) — nothing is sitting approved-but-unstarted. `ls docs/plans/rejected/` starts earning its keep as the "what did we walk away from" record.
- **Negative / accepted costs:** the underlying gap ADR 0013 identified is unfixed and now unowned: on a fresh Codespace or container rebuild, neither `.env` nor `frontend/.env.local` is created, and both Hardhat and CRA start with those vars silently undefined (`hardhat.config.js` quietly omits the `sepolia` network; the frontend renders "no contract configured"). ADR 0008 had already deferred this once; it is now deferred indefinitely.
- **Not affected:** the Pinata JWT rotation. ADR 0013 listed it as a manual follow-up, but it has its own trio — draft 0014 (`rotate-pinata-credentials`) — which is untouched by this rejection. The plaintext JWT in `frontend/.env.local` that decodes to a real personal email address remains a live, unrotated credential tracked there. See memory `docs/memory/frontend/pinata-jwt-only-credential.md`.
- **Follow-ups required:** none mandated. If the fresh-checkout gap resurfaces, `rejected/README.md` prescribes a new ADR + trio with a fresh `NNNN` linking back to 0013 rather than reviving this one.
