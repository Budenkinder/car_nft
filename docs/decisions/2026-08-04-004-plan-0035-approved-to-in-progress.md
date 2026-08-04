---
date: 2026-08-04
scope: both
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Plan 0035 transitioned approved → in-progress; autonomous implementation begins

## Context

Immediately following decision `2026-08-04-003` (draft → approved, issue #43 filed), the user's `autonomous` instruction means implementation starts in the same turn — there is no separate waiting period between approval and the first task.

## Decision

Move both plan files from `docs/plans/approved/` to `docs/plans/in-progress/`, update `Status:` frontmatter and `Paired plan:` paths in both, and update ADR 0035's `Related plans:` paths. Implementation proceeds task-by-task per CLAUDE.md §5's `autonomous` mode: work through the contracts and frontend task lists in order, keeping the two sides in lockstep, checking off each task in its plan file as it completes, and stopping only on a genuine blocker — not for per-task review.

One blocker is anticipated ahead of time: **the Sepolia upgrade** (contracts task 10 / decision-relevant since it changes a live, deployed contract other people's frontend points at) is a real, hard-to-reverse action against shared infrastructure. Per this session's standing instruction to confirm before actions with real external blast radius, that step will pause for explicit user go-ahead rather than running unattended, even under `autonomous`.

## Alternatives Considered

- **Proceed straight to in-progress and implement, pausing before Sepolia** *(chosen)* — matches both CLAUDE.md's status-folder invariants and the standing rule that irreversible actions touching shared/live systems get a confirmation checkpoint regardless of autonomy mode.
- **Run the entire plan including the Sepolia upgrade unattended** — rejected: upgrading the live Sepolia proxy is a one-way action affecting the deployed registry the Vercel frontend already points at; `autonomous` governs plan-task pacing, not a blanket waiver on confirming external, hard-to-reverse actions.

## Consequences

- **Positive:** implementation proceeds without per-task check-ins, as requested, while the one genuinely risky, externally-visible step still gets a confirmation gate.
- **Negative / accepted costs:** none.
- **Follow-ups required:** when all tasks up to the Sepolia step are done, surface that checkpoint explicitly rather than silently skipping or silently executing it. On full completion (including Sepolia, once confirmed), transition the trio to `done/`, bump ADR 0035 to `accepted`, close issue #43, and execute contracts task 11 (moving ADR 0030's plan trio to `rejected/`, closing issue #36).
