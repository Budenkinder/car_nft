# Plan 0034 — File a GitHub tracking issue on plan approval — Frontend

- **ADR:** `docs/adr/0034-github-issue-on-plan-approval.md`
- **Paired plan:** `docs/plans/done/0034-github-issue-on-plan-approval-contracts.md`
- **GitHub Issue:** [#40](https://github.com/Budenkinder/car_nft/issues/40)
- **Status:** done
- **Date:** 2026-08-01

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

**No changes required to `frontend/` code.** This is a docs/workflow change only — no React component, service, ABI consumer, or environment variable is touched.

The actionable docs-and-workflow tasks live here rather than in the contracts plan, following the convention established by plan 0002: when a request is neither frontend nor contracts code, the frontend plan carries the tasks and the contracts plan is the no-op.

This plan delivers the rule from ADR 0034: a GitHub issue must be filed whenever a plan trio enters `docs/plans/approved/`, and closed when it enters `done/` or `rejected/`.

Out of scope:

- No automation script (`scripts/plan-status.sh`) — the transition stays a manual checklist, consistent with ADR 0002's deferral.
- No GitHub Actions workflow, issue template, or label scheme.
- No retroactive issue creation for the three long-lived drafts (0014, 0019, 0021) — they are not approved, so the rule does not reach them.
- No change to the ADR template, the decision-log template, or the memory format.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `CLAUDE.md` | modify | §2a: add the issue-creation step to the transition checklist (entering `approved/`), the issue-closing step (entering `done/` / `rejected/`), and the "every plan in `approved/`/`in-progress/` has a live issue link" invariant |
| `docs/plans/README.md` | modify | note the issue rule alongside the status table so the folder's own README is self-contained |
| `docs/plans/draft/_template-frontend.md` | modify | change the `GitHub Issue:` line's parenthetical from "omit line if none filed yet" to state that the field is required from `approved/` onward |
| `docs/plans/draft/_template-contracts.md` | modify | same change as the frontend template |
| `docs/plans/approved/README.md` | modify | add the entry condition: a trio only lands here once its issue exists and is linked |
| `docs/adr/0034-github-issue-on-plan-approval.md` | modify | rewrite `Related plans:` paths when this trio leaves `draft/` |
| `docs/plans/approved/0013-devcontainer-env-scaffolding-{frontend,contracts}.md` | modify | *(task 6, done)* added the `GitHub Issue:` line for backfilled #41. Trio 0013 was rejected and un-rejected later the same day (`2026-08-02-006` → `2026-08-02-007`); it is back in `approved/` at this path and #41 is open again |
| `docs/memory/frontend/github-issue-on-plan-approval.md` | add | memory of the rule (written up front, since it is a standing user directive) |
| `docs/memory/MEMORY.md` | modify | index entry for the new memory file |
| `docs/decisions/2026-08-01-001-github-issue-on-plan-approval.md` | add | decision-log entry for adopting the rule |
| `docs/plans/done/0027-nft-transaction-provenance-link-{frontend,contracts}.md` | modify | *(task 6a, added during implementation)* `GitHub Issue:` line for backfilled #42 |
| `docs/adr/0027-nft-transaction-provenance-link.md` | modify | *(task 6a)* #42 added to `## References` |
| `docs/adr/0013-devcontainer-env-scaffolding.md` | modify | *(task 6)* #41 added to `## References` |
| `docs/decisions/2026-08-02-00{1,2,3,4,5}-*.md` | add | transition entries (draft→approved, approved→in-progress, in-progress→done) plus the two backfill decisions |
| `docs/decisions/INDEX.md` | modify | index entries, newest first |

## Tasks

Execute in order. Each task is independently reviewable.

- [x] **1.** Amend `CLAUDE.md` §2a. Add to the numbered transition workflow: **on entering `approved/`**, file the issue via `gh issue create --repo Budenkinder/car_nft` (title `<short description> (ADR NNNN)`; body = one-paragraph scope summary + repo-relative links to the ADR and both plans), reuse an existing issue if the trio already has one, and stop and surface the blocker if `gh` is unavailable rather than skipping. Add: **on entering `done/` or `rejected/`**, close the issue (`--reason "not planned"` for `rejected/`). State the invariant: every plan file in `approved/` or `in-progress/` carries a live `GitHub Issue:` link.
- [x] **2.** Add the same rule, in one or two lines, to `docs/plans/README.md` under the status table, and add the entry condition to `docs/plans/approved/README.md`.
- [x] **3.** Update both plan templates (`draft/_template-frontend.md`, `draft/_template-contracts.md`): the `GitHub Issue:` line stays optional in `draft/`, becomes required from `approved/` onward. Adjust the parenthetical text accordingly.
- [x] **4.** *(Done up front — required by CLAUDE.md §4 for the planning decision itself.)* Write the decision-log entry `docs/decisions/2026-08-01-001-github-issue-on-plan-approval.md` and prepend its line to `docs/decisions/INDEX.md`.
- [x] **5.** *(Done up front — a standing user directive must not be lost while the plan waits for review.)* Write `docs/memory/frontend/github-issue-on-plan-approval.md` (type `feedback`, scope `frontend`, with **Why:** / **How to apply:** lines, linking `[[plan-status-folders]]`) and add its one-line entry to `docs/memory/MEMORY.md`.
- [x] **6.** *(Confirmed by the user.)* Backfill trio 0013: filed [#41](https://github.com/Budenkinder/car_nft/issues/41), added the `GitHub Issue:` line to both 0013 plan files and the link to ADR 0013's `## References`. Decision: `docs/decisions/2026-08-02-003-backfill-issue-for-approved-plan-0013.md`.
- [x] **6a.** *(Amendment, added during implementation — not in the approved plan.)* Trio 0027 sits in `in-progress/` with no issue, so the invariant written in task 1 would have been false on commit. Filed [#42](https://github.com/Budenkinder/car_nft/issues/42) and linked it from both 0027 plan files and ADR 0027's `## References`. Decision: `docs/decisions/2026-08-02-004-backfill-issue-for-in-progress-plan-0027.md`.
- [x] **7.** Applied the new rule to this trio on its own `draft → approved` transition: filed [#40](https://github.com/Budenkinder/car_nft/issues/40), linked from both 0034 plan files and ADR 0034's `## References` — the rule's first live exercise. Decision: `docs/decisions/2026-08-02-001-plan-0034-draft-to-approved.md`.

## Interfaces with Contracts

None. No contract function is called, no event consumed, no ABI or address handoff changes.

## Testing

Verification is by inspection, not by test runner:

- `grep -L "GitHub Issue" docs/plans/approved/*.md docs/plans/in-progress/*.md` returns nothing once tasks 6–7 are done — every non-draft, non-terminal plan carries a link.
- `gh issue list --repo Budenkinder/car_nft --state open` contains an entry for each trio in `approved/` and `in-progress/`.
- Every issue linked from a trio in `done/` or `rejected/` is closed.
- `CLAUDE.md` §2a, `docs/plans/README.md`, `docs/plans/approved/README.md`, and both templates agree on the trigger point (approval) — no contradictory wording between them.

## Risks and Rollback

- **Risk:** approval transitions now depend on `gh` auth/network; a failure blocks a previously-local operation. *Mitigation:* the rule is to surface the blocker, not to work around it — the user can then file the issue manually and supply the number.
- **Risk:** a duplicate issue gets filed for a trio that already had one from `draft` time (0029–0033 all do). *Mitigation:* task 1's wording makes "reuse if it exists" explicit; the plan file's own `GitHub Issue:` line is the check.
- **Risk:** drift between the four places the rule is written down (`CLAUDE.md`, two READMEs, two templates). *Mitigation:* `CLAUDE.md` §2a is the normative source; the others say the same thing in one line and point at it.
- **Rollback:** every task is a docs edit — `git revert` the commit. Any issues already filed can be closed as not planned; no code or on-chain state is affected.

## Open Questions

Both resolved on 2026-08-02 by the user's "continue like proposed" — i.e. both recommendations stand. Kept here for the record:

- ~~**Task 6 (backfill 0013):** trio 0013 has been sitting in `approved/` since 2026-07-23 with no issue. Recommendation: do it.~~ **Resolved: backfill confirmed.** Filed as [#41](https://github.com/Budenkinder/car_nft/issues/41). The same reasoning was then extended to in-progress trio 0027 as task 6a ([#42](https://github.com/Budenkinder/car_nft/issues/42)).
- ~~**Closing on `done/`:** explicit `gh issue close`, or auto-close via `Closes #NN` in a merge PR?~~ **Resolved: explicit `gh issue close`,** as specified in task 1 — not every plan completion in this repo goes through a PR. Written into `CLAUDE.md` §2a step 7.
