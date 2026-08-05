---
date: 2026-08-02
scope: both
status: accepted
related_adr: 0034-github-issue-on-plan-approval
supersedes: none
---

# Plan 0034 transitioned in-progress → done; ADR 0034 bumped proposed → accepted; issue #40 closed

## Context

All tasks in plan 0034's frontend checklist are complete: `CLAUDE.md` §2a amended (steps 6 and 7 of the transition checklist plus the "Every approved plan has a GitHub issue" bullet), `docs/plans/README.md` and `docs/plans/approved/README.md` updated, both plan templates reworded, the decision-log and memory entries written, and the two backfills filed (#41 for trio 0013, #42 for trio 0027). The contracts plan was a no-op throughout.

## Decision

Move both 0034 plan files to `docs/plans/done/`, set `Status: done`, rewrite the paired-plan paths and ADR 0034's `Related plans:`, bump ADR 0034 from `proposed` to `accepted` (matching the precedent in `2026-07-31-001`), and flip decision `2026-08-01-001` from `proposed` to `accepted` now that the rule it describes is normative in `CLAUDE.md`.

Per the close-on-terminal rule this plan itself introduced, issue [#40](https://github.com/Budenkinder/car_nft/issues/40) was closed with a comment pointing at what shipped — the rule's first close, immediately after being its own first create.

Verification run before the transition:

- `grep -L "GitHub Issue" docs/plans/approved/*.md docs/plans/in-progress/*.md` → only `in-progress/README.md`, which is not a plan file. Invariant holds.
- `gh issue list --state open` → #41 (approved 0013) and #42 (in-progress 0027) open, #40 closed; every non-terminal trio is represented.
- Trigger-point wording checked across `CLAUDE.md` §2a, both READMEs, and both templates — all say `approved/`, no contradictions.

## Alternatives Considered

- **Close #40 and mark done now** *(chosen)* — the checklist is complete and verified; leaving the trio in `in-progress/` would put the folder tree out of step with reality, which is the failure mode ADR 0002 exists to prevent.
- **Leave the trio in `in-progress/` until the docs changes are committed and merged to `main`** — rejected: this repo's `done/` convention has tracked task completion, not merge status (see plans 0026, 0028, both marked done on `dev`).

## Consequences

- **Positive:** the rule is live, self-tested end to end (create on approve, close on done), and every plan folder now agrees with the issue tracker.
- **Negative / accepted costs:** `docs/plans/done/` gains a trio for a pure docs change, and this session produced five decision-log entries for one rule — the cost of §2a's per-transition logging on a fast-moving change.
- **Follow-ups required:** `docs/plans/done/README.md` and `docs/plans/rejected/README.md` were left untouched — they do not yet mention the close-on-entry step, which lives in `CLAUDE.md` §2a and `docs/plans/README.md`. Worth a one-line addition next time either file is edited; not worth its own trio. Issues #41 and #42 must be closed when trios 0013 and 0027 reach a terminal folder.
