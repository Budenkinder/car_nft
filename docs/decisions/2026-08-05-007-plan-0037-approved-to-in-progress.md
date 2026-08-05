---
date: 2026-08-05
scope: both
status: accepted
related_adr: 0037-application-onchain-receipt
supersedes: none
---

# Plan 0037 transitioned approved → in-progress; autonomous implementation begins

## Context

Immediately following the `draft → approved` transition (decision `2026-08-05-006`) and issue #44 filing, "autonomous" means proceeding straight into task execution — matching how plan 0035 handled the same instruction (decisions `2026-08-04-003`, `-004`).

## Decision

Moved both `0037-application-onchain-receipt-frontend.md` and `-contracts.md` from `docs/plans/approved/` to `docs/plans/in-progress/`, updated `Status:` frontmatter and `Paired plan:` paths, and rewrote ADR 0037's `Related plans:` paths. Task execution begins next, following each plan's task list in order, marking tasks done as completed. Per the user's standing session instructions, the Sepolia deployment step (if reached) still requires explicit confirmation before running — this plan's contracts work only requires a local Hardhat deploy/upgrade to verify, so that blocker is not expected to be hit here.

## Alternatives Considered

- **Proceed straight to in-progress and start tasks** *(chosen)* — "autonomous" is specifically the instruction to work through tasks without stopping for per-task review; pausing again right after approval would contradict that instruction.

## Consequences

- **Positive:** Implementation can proceed without further status-transition overhead.
- **Negative / accepted costs:** none.
- **Follow-ups required:** mark tasks done in both plan files as they complete; a final `in-progress → done` transition (with its own decision entry) once every task is complete and verified.
