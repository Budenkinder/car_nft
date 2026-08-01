# ADR 0034: File a GitHub tracking issue whenever a plan trio enters `approved/`

- **Status:** accepted
- **Date:** 2026-08-01
- **Scope:** both
- **Related plans:**
  - `docs/plans/done/0034-github-issue-on-plan-approval-frontend.md`
  - `docs/plans/done/0034-github-issue-on-plan-approval-contracts.md`
- **Related decisions:** `docs/decisions/2026-08-01-001-github-issue-on-plan-approval.md`, `docs/decisions/2026-07-31-009-link-plans-to-github-issues.md`

## Context

The user gave a new standing rule: *"when creating a new approved plan, create the corresponding github issue."*

Today the repo has half of that. Decision `2026-07-31-009` added a `**GitHub Issue:**` header line to both plan templates and backfilled issues #35–#39 onto the 0029–0033 draft trios — but that was a one-off backfill of issues that a human had already filed by hand. Nothing in `CLAUDE.md` says *when* an issue must exist, so the field is populated only when someone remembers.

The gap is visible in the tree: `docs/plans/approved/` holds trio 0013 (`devcontainer-env-scaffolding`, approved 2026-07-23) with **no** `GitHub Issue:` line and no issue on GitHub, while five *draft* trios (0029–0033) that nobody has approved yet do have issues. The tracker and the plan folders disagree about what the actual backlog is.

Approval is the natural trigger. It is the moment a plan stops being a proposal and becomes committed work — which is exactly what an issue tracker is for, and it is already a well-defined, multi-file, checklist-driven event in `CLAUDE.md` §2a, so one more step slots in cleanly.

Constraints: the repo is `Budenkinder/car_nft`, issues are enabled, and `gh` is authenticated in this environment — so issue creation can be scripted rather than asked of the user.

## Decision

Every transition **into** `docs/plans/approved/` — whether `draft → approved` or a trio created directly as `approved` — must file a GitHub issue in `Budenkinder/car_nft` as part of that transition, and record its number on both plan files.

Concretely, `CLAUDE.md` §2a's transition checklist grows two conditional steps:

- **On entering `approved/`:** create the issue with `gh issue create`, then write `**GitHub Issue:** [#NN](https://github.com/Budenkinder/car_nft/issues/NN)` into both plan files and add the same link to the ADR's `## References`. If an issue already exists for the trio (e.g. 0029–0033, filed while still in `draft/`), reuse it — never file a second one.
- **On entering `done/` or `rejected/`:** close that issue (`gh issue close`, with `--reason "not planned"` for `rejected/`), so the open-issue list stays equal to the set of non-terminal approved/in-progress trios.

Issue conventions, matching the #35–#39 precedent:

- **Title:** `<short description of the work> (ADR NNNN)`
- **Body:** one-paragraph scope summary, plus repo-relative links to the ADR and both plan files.
- Filing an issue at `draft` time stays *allowed* (nothing is broken by an early issue) but is not required. Approval is the point at which it becomes mandatory.
- If `gh` is unavailable or unauthenticated, the approval transition **stops** and the blocker is surfaced to the user — per `CLAUDE.md`'s "No Exceptions", the rule is not silently skipped.

The invariant this establishes: *every plan file under `approved/` or `in-progress/` carries a live `GitHub Issue:` link, and every such issue is open.*

## Options Considered

### Option A — File the issue on entry to `approved/` (chosen)
- **Pros:** Matches the user's wording literally. The tracker then holds exactly the committed work, not speculation — `gh issue list` and `ls docs/plans/{approved,in-progress}/` answer the same question. Approval is already a scripted multi-file checklist, so the new step has an obvious home and an obvious checkpoint (the decision-log entry) where a missed issue gets caught.
- **Cons:** Approval becomes a step that can fail for network/auth reasons rather than being a pure local file move. Drafts that sit unapproved for a long time (0014, 0019, 0021) remain invisible on GitHub.

### Option B — File the issue when the plan trio is first written (at `draft`)
- **Pros:** Every plan is discoverable on GitHub from birth; one rule, no conditional-on-status logic; matches how 0029–0033 happen to look right now.
- **Cons:** Turns the tracker into a mirror of `docs/plans/draft/`, including plans that may be rejected outright — issue noise for work nobody committed to. Contradicts the user's actual instruction, which names *approved* specifically. Rejected.

### Option C — File the issue when implementation starts (entry to `in-progress/`)
- **Pros:** Issues exist only for work actively in flight; shortest possible open-issue lifetime.
- **Cons:** The approved-but-not-started backlog — the single most useful thing to see in a tracker — would be invisible. Also the weakest trigger in practice, since `approved → in-progress` often follows approval within the same session, so the issue would be created too late to have served as a planning artifact. Rejected.

### Option D — Status quo: no rule, populate `GitHub Issue:` ad hoc
- **Pros:** Zero process cost.
- **Cons:** This is what produced the current inconsistency (approved 0013 has no issue; draft 0029–0033 do). Explicitly overridden by the user's directive. Rejected.

## Consequences

- **Positive:** The GitHub tracker becomes a trustworthy view of committed work. Plan → issue and issue → plan are both one hop. The close-on-terminal rule keeps the open list from accumulating shipped work.
- **Negative / accepted costs:** Approval transitions now depend on `gh` auth and network. One more failure mode in a workflow that used to be pure local file moves. A trio that is approved and immediately rejected still leaves a closed-as-not-planned issue behind — accepted as honest history.
- **Frontend impact:** None on `frontend/` code. By this repo's convention (established by ADR 0002), the actionable docs/workflow tasks live in the frontend plan.
- **Contracts impact:** None. No Solidity, Hardhat script, ABI, or deployment artifact is touched.
- **Follow-ups:** Trio 0013 sits in `approved/` with no issue — a pre-existing violation of the new invariant. Backfilling it is proposed as the last task of the frontend plan, pending user confirmation (see that plan's Open Questions). No automation script (`scripts/plan-status.sh`) is proposed here; consistent with ADR 0002, that is deferred until the manual checklist proves to be real friction.

## References

- `docs/decisions/2026-07-31-009-link-plans-to-github-issues.md` — added the `GitHub Issue:` field and backfilled #35–#39; this ADR supplies the missing "when".
- `docs/adr/0002-plan-status-folders.md` — the status-folder workflow this rule extends, and the source of the "docs tasks go in the frontend plan" convention.
- `CLAUDE.md` §2a — the transition checklist being amended.
- Existing issues [#35](https://github.com/Budenkinder/car_nft/issues/35)–[#39](https://github.com/Budenkinder/car_nft/issues/39) — the title/body precedent this rule codifies.
- [#40](https://github.com/Budenkinder/car_nft/issues/40) — this trio's own tracking issue, filed on its `draft → approved` transition as the rule's first application.
- [#41](https://github.com/Budenkinder/car_nft/issues/41) — backfilled tracking issue for the previously issue-less approved trio 0013.
