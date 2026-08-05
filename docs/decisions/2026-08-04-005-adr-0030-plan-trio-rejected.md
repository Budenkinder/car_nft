---
date: 2026-08-04
scope: both
status: accepted
related_adr: 0030-structured-vehicle-record
supersedes: none
---

# ADR 0030's plan trio moved to `rejected/`; issue #36 closure blocked on `gh` token permissions

## Context

Decision `2026-08-03-004` established that ADR 0030's access-control half is absorbed into ADR 0035, and its plan trio moves to `docs/plans/rejected/` when trio 0035 is approved — which happened in this session (decision `2026-08-04-003`). Per CLAUDE.md §2a, this transition is contracts task 11 of plan 0035.

## Decision

Moved both `0030-structured-vehicle-record-{contracts,frontend}.md` from `docs/plans/draft/` to `docs/plans/rejected/`, updated `Status:` to `rejected` and `Paired plan:` paths in both, and updated ADR 0030's `Related plans:` paths to match.

**Issue #36 closure failed**: `gh issue close 36 --repo Budenkinder/car_nft --reason "not planned"` returned `GraphQL: Resource not accessible by personal access token (closeIssue)` — the configured token can create issues (used successfully for #43 earlier this session) but lacks permission to close them. Per CLAUDE.md §2a ("If `gh` is unavailable or unauthenticated, stop the transition and surface the blocker — this step is never silently skipped"), this is surfaced to the user rather than worked around (e.g. by fabricating closure through some other path). Issue #36 remains open, pointing at a plan trio that is otherwise fully marked `rejected/` on disk.

## Alternatives Considered

- **Move the plan files and surface the issue-closure blocker separately** *(chosen)* — the file-level transition is complete and correct; the GitHub-side action is blocked by something outside this session's control (token scope), not by any ambiguity in what should happen.
- **Skip the file transition until the issue can also be closed** — rejected: the file-level move and frontmatter/link updates are independent of GitHub connectivity and there's no reason to leave the repo in a stale state (plan trio still in `draft/`, ADR still pointing at the wrong folder) while waiting on a token permission fix.

## Consequences

- **Positive:** `docs/plans/rejected/` and ADR 0030 accurately reflect the trio's real status; `ls docs/plans/rejected/` continues to answer "what did we walk away from and why" correctly.
- **Negative / accepted costs:** issue #36 is open on GitHub while its plan trio shows `rejected/` on disk — a temporary mismatch between the repo and GitHub until the token's permissions are fixed or a maintainer closes it manually.
- **Follow-ups required:** the user (or someone with a `gh` token that has `issues: write` including close) needs to run `gh issue close 36 --repo Budenkinder/car_nft --reason "not planned"` manually. Worth checking whether the same token-scope gap will block future `done`/`rejected` transitions' issue-closing step.
