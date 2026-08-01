---
name: github-issue-on-plan-approval
description: Standing user rule (2026-08-01) — a plan trio entering approved/ must get a GitHub issue in Budenkinder/car_nft, linked from both plan files.
metadata:
  type: feedback
  scope: frontend
---

The user's rule, given verbatim on 2026-08-01: *"when creating a new approved plan, create the corresponding github issue."*

Trigger point is **entry into `docs/plans/approved/`** — either a `draft → approved` transition or a trio created directly as approved. Filing an issue earlier (while still in `draft/`) is allowed but not required; trios 0029–0033 already have #35–#39 from draft time and must **reuse** those, not duplicate them.

**Why:** the GitHub tracker should show committed work, and only committed work. Before this rule, `docs/plans/approved/` and the issue list disagreed — approved trio 0013 had no issue while five unapproved drafts did. Approval is the moment a plan stops being a proposal, which is exactly what an issue represents.

**How to apply:**

- On entering `approved/`: `gh issue create --repo Budenkinder/car_nft` with title `<short description> (ADR NNNN)` and a body linking the ADR plus both plan files. Then write `**GitHub Issue:** [#NN](https://github.com/Budenkinder/car_nft/issues/NN)` into **both** plan files (frontend and contracts, even the no-op one) and add the link to the ADR's `## References`.
- On entering `done/` or `rejected/`: close the issue — `--reason "not planned"` for rejected.
- Invariant to check: every plan file in `approved/` or `in-progress/` carries a live issue link, and each of those issues is open.
- `gh` unavailable or unauthenticated is a **blocker to surface**, not a step to skip.

Live since 2026-08-02: the rule is normative in `CLAUDE.md` §2a (transition steps 6–7 plus the "Every approved plan has a GitHub issue" bullet), mirrored in `docs/plans/README.md`, `docs/plans/approved/README.md`, and both plan templates. ADR 0034 is accepted; plan trio 0034 is in `docs/plans/done/`. Backfilled at the same time: [#41](https://github.com/Budenkinder/car_nft/issues/41) for approved trio 0013, [#42](https://github.com/Budenkinder/car_nft/issues/42) for in-progress trio 0027 — both still open and awaiting their own terminal transitions. See [[plan-status-folders]] for the rest of the transition checklist this step attaches to.
