---
date: 2026-08-02
scope: both
status: accepted
related_adr: 0034-github-issue-on-plan-approval
supersedes: none
---

# Plan 0034 transitioned approved → in-progress; implementation runs straight through

## Context

The 0034 trio was approved and issue [#40](https://github.com/Budenkinder/car_nft/issues/40) filed (see `2026-08-02-001`). The user's "continue like proposed" carried no per-task review request, and every remaining task is a docs edit with no code, no ABI, and no on-chain effect.

## Decision

Move both plan files to `docs/plans/in-progress/`, set frontmatter `Status: in-progress`, rewrite the paired-plan paths and ADR 0034's `Related plans:`, and work tasks 1–3, 6 and 7 through to completion in one pass rather than stopping between them. Issue #40 stays open until the trio reaches `done/`.

Tasks 4 (decision log) and 5 (memory) were already completed during planning and are checked off in the plan with a note explaining why.

## Alternatives Considered

- **Run straight through** *(chosen)* — the tasks are four small docs edits plus one already-filed backfill issue; per-task review would cost more round-trips than the changes are worth, and every edit is trivially revertable.
- **Stop after each task for review** (the `implement` cadence) — rejected: the user said "continue", and no task carries risk that review between steps would catch better than review of the whole diff.

## Consequences

- **Positive:** the rule lands in `CLAUDE.md` in one reviewable diff.
- **Negative / accepted costs:** the user sees the docs changes only after all of them are written; if the wording of §2a is not what they wanted, it is one edit pass to fix.
- **Follow-ups required:** close #40 and move the trio to `done/` once tasks 1–3, 6, 7 are verified.
