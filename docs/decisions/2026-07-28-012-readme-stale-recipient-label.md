---
date: 2026-07-28
scope: frontend
status: accepted
related_adr: 0025-readme-stale-recipient-label
supersedes: none
---

# README's "Using the app" step synced to the current recipient field label

## Context

ADR 0023 relabeled the mint form's recipient field in the UI to "TÜV Car Inspection Wallet Address (recipient)". README's "Using the app" walkthrough still referenced the old "Car Owner Wallet (recipient)" text, flagged as an explicit non-goal in ADR 0024 and left for a separate request. User then asked for it directly ("fix it too").

## Decision

Wrote ADR 0025 + plan trio 0025, then on `autonomous` moved the plan from `draft` to `in-progress` and executed both frontend tasks: updated `README.md:273` to the current label text, and confirmed via grep that no other stale occurrences remain. Contracts plan is a no-op (doc-only).

## Alternatives Considered

None — same established pattern as prior single-task README plans this session (0022, 0023, 0024).

## Consequences

- README's UI walkthrough now matches the live form label exactly.
- Plan 0025 remains in `docs/plans/in-progress/` rather than `done/` since nothing has been committed to git yet — awaiting the user's decision on committing.
