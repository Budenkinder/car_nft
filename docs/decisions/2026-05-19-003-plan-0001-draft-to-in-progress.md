---
date: 2026-05-19
scope: frontend
status: accepted
related_adr: 0001-frontend-theme-mode-toggle
supersedes: none
---

# Plan 0001 transitioned draft → in-progress

## Context

The user approved plan 0001 (toggleable light/dark mode) and triggered autonomous implementation via the `autonomous` command. Per CLAUDE.md section 2a, plan status transitions are a multi-file change requiring frontmatter, paired-plan path, ADR links, and a decision log entry to stay consistent.

## Decision

Move both plan files for the 0001 trio from `docs/plans/draft/` to `docs/plans/in-progress/`. Update each plan's `Status:` frontmatter and `Paired plan:` path, and update the ADR's `Related plans:` paths to point at the new folder.

## Alternatives Considered

- **Stay in `draft/` while implementing** — rejected. Violates the strict folder rule that the directory tree must reflect lifecycle.
- **Skip straight to `done/` at the end** — rejected. `in-progress/` is the documented signal that implementation is active; skipping it would hide the in-flight state from anyone glancing at `ls docs/plans/`.

## Consequences

- **Positive:** folder tree accurately reflects active work; matching ADR/plan paths stay consistent.
- **Negative / accepted costs:** the move is plain `mv` (not `git mv`) because `docs/` is not yet under version control; once it is committed, the relocation will show up as a fresh add at the new path. No history is lost because none exists yet for these files.
- **Follow-ups required:** at completion, perform the matching `in-progress/` → `done/` transition with the same five-step procedure and its own decision log entry.
