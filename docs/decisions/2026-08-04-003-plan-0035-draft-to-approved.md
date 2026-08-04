---
date: 2026-08-04
scope: both
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Plan 0035 transitioned draft → approved; issue #43 filed

## Context

The user reviewed ADR 0035 and its plan trio across this session — first directing the multisig removed in favor of deployer-EOA admin (decision `2026-08-04-001`), then requesting a terminal role-granting script and a frontend org-wallet list (decision `2026-08-04-002`) — and then said `autonomous`, the CLAUDE.md-defined trigger to both approve and begin unattended implementation of the plan.

## Decision

Move both plan files from `docs/plans/draft/` to `docs/plans/approved/` via `mv` (untracked files, so no `git mv` history to preserve), update each file's `Status:` frontmatter to `approved` and `Paired plan:` path to match, update ADR 0035's `Related plans:` paths, and file GitHub tracking issue [#43](https://github.com/Budenkinder/car_nft/issues/43), linked from both plan files and the ADR's References section, per CLAUDE.md §2a.

## Alternatives Considered

- **File the transition as its own step before implementing** *(chosen)* — CLAUDE.md §2a treats every status transition, including draft→approved, as a mandatory multi-file change with its own decision log entry; skipping straight to `in-progress` would leave `approved/` never populated and violate "every plan file in `approved/` or `in-progress/` carries a live GitHub Issue: link."
- **Treat `autonomous` as only an implementation trigger, not an approval** — rejected: CLAUDE.md §5 defines `autonomous`/`implement` as the review checkpoint itself; there is no separate approval step the user is expected to perform first.

## Consequences

- **Positive:** the trio now carries a live tracking issue before any code changes land, matching the invariant this repo maintains for every other approved/in-progress plan.
- **Negative / accepted costs:** none — this is bookkeeping ahead of the real work.
- **Follow-ups required:** immediately followed by a second transition, approved → in-progress, since implementation starts in the same turn (see the next decision file).
