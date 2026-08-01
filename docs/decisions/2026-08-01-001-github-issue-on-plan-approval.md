---
date: 2026-08-01
scope: both
status: accepted
related_adr: 0034-github-issue-on-plan-approval
supersedes: none
---

# Trigger GitHub issue creation on entry to `approved/`, not at draft time or at implementation start

## Context

The user gave a standing rule: *"when creating a new approved plan, create the corresponding github issue."* Decision `2026-07-31-009` had already added a `**GitHub Issue:**` field to the plan templates and backfilled #35–#39 onto the 0029–0033 trios, but never said *when* an issue is required — so the field is filled in only when someone remembers. The result is inconsistent: approved trio 0013 has no issue, while five unapproved drafts do.

The directive itself is not in question. What needed deciding was the exact trigger point, and what happens to the issue at the end of a plan's life. This record's `proposed` status tracks the codification in `CLAUDE.md`, which awaits user review per `CLAUDE.md` §5.

## Decision

Issue creation is bound to the **`approved/` transition**. Every move into `docs/plans/approved/` — draft→approved, or a trio created directly as approved — files a GitHub issue in `Budenkinder/car_nft` (title `<short description> (ADR NNNN)`, body linking the ADR and both plans) and records `**GitHub Issue:** [#NN](…)` on both plan files plus the ADR's `## References`. An issue that already exists from draft time is reused, never duplicated.

Symmetrically, entering `done/` or `rejected/` closes that issue (`--reason "not planned"` for rejected). Filing an issue while still in `draft/` stays permitted but not required.

If `gh` is unavailable or unauthenticated, the transition stops and the blocker goes to the user — the step is never silently skipped.

## Alternatives Considered

- **On entry to `approved/`** *(chosen)* — matches the user's wording literally, and makes the open-issue list equal to the set of committed, non-terminal trios.
- **At draft creation** — rejected: turns the tracker into a mirror of `docs/plans/draft/`, including plans that may never be adopted, and contradicts the directive's explicit "approved".
- **At entry to `in-progress/`** — rejected: hides the approved-but-not-started backlog, which is the most useful thing a tracker shows; also fires too late to be a planning artifact, since approval and start often land in the same session.
- **Leave it ad hoc (status quo)** — rejected: this is precisely what produced the current 0013-vs-0029..0033 inconsistency.

## Consequences

- **Positive:** GitHub becomes a trustworthy view of committed work; plan↔issue is one hop in both directions; closing on terminal statuses keeps the open list from filling with shipped work.
- **Negative / accepted costs:** approval transitions now depend on `gh` auth and network, adding a failure mode to what was a pure local file move. The rule is written in four places (`CLAUDE.md` §2a, `docs/plans/README.md`, `docs/plans/approved/README.md`, both templates), so drift is possible — §2a is normative and the others are one-liners pointing at it.
- **Follow-ups required:** implement plan 0034 (`CLAUDE.md` §2a amendment, README and template updates, memory entry). Backfilling trio 0013's missing issue is proposed as task 6 of the frontend plan, pending user confirmation. When trio 0034 is itself approved, it becomes the rule's first live exercise.
