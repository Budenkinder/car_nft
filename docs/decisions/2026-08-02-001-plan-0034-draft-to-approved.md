---
date: 2026-08-02
scope: both
status: accepted
related_adr: 0034-github-issue-on-plan-approval
supersedes: none
---

# Plan 0034 transitioned draft → approved; issue #40 filed as the new rule's first application

## Context

The user reviewed the 0034 trio (file a GitHub tracking issue when a plan is approved) and answered both open questions with "continue like proposed": backfill trio 0013's missing issue (task 6 confirmed), and close issues explicitly with `gh issue close` on the terminal transition rather than relying on `Closes #NN` in a merge PR.

## Decision

Move both 0034 plan files from `docs/plans/draft/` to `docs/plans/approved/` and set their frontmatter `Status: approved`. Because this is an entry into `approved/`, the rule the trio itself defines applies to it: [#40](https://github.com/Budenkinder/car_nft/issues/40) was filed and linked from both plan files and ADR 0034's `## References`.

Both files were **untracked** at the time of the move, so plain `mv` was used instead of `git mv` — same precedent as plan 0002's migration. This is a mechanical detail, not a deviation from the §2a checklist.

The two confirmed answers are now settled and are implemented as written: task 6 (backfill 0013) proceeds, and `CLAUDE.md` §2a specifies an explicit `gh issue close` on entry to `done/`/`rejected/`.

## Alternatives Considered

- **Apply the new rule to trio 0034 itself** *(chosen)* — the rule is normative from the moment it is approved, and self-application is the cheapest possible end-to-end test of it.
- **Exempt 0034 from its own rule until `CLAUDE.md` is amended** — rejected: it would leave the one trio that defines the invariant as the only approved trio violating it, and would postpone finding any problem with the rule until the next unrelated approval.
- **Skip `approved/` and go straight draft → in-progress** (the path plans 0026–0028 took) — rejected: it would bypass the very transition this ADR hangs off, so the rule would ship without ever having been exercised.

## Consequences

- **Positive:** the rule is proven by use before it is written into `CLAUDE.md`. `docs/plans/approved/` now holds two trios (0013, 0034), and after the backfill both carry live issue links.
- **Negative / accepted costs:** the trio will pass through three transitions (`approved` → `in-progress` → `done`) in short order, each requiring its own decision-log entry — verbose for a docs-only change, but it is what §2a prescribes.
- **Follow-ups required:** transition to `in-progress` and execute tasks 1–3, 6, 7 of the frontend plan; close #40 when the trio reaches `done/`.
