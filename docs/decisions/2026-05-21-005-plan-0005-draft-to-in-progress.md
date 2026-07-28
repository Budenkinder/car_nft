---
date: 2026-05-21
scope: both
status: accepted
related_adr: 0005-deploy-script-frontend-sync
supersedes: none
---

# Plan 0005 transitioned draft → in-progress

## Context

The user approved plan 0005 (deploy.js syncs the frontend address + ABI) and triggered autonomous implementation via the `autonomous` command. Per CLAUDE.md section 2a, plan status transitions are a multi-file change requiring frontmatter, paired-plan path, ADR links, and a decision log entry to stay consistent.

## Decision

Move both plan files for the 0005 trio from `docs/plans/draft/` to `docs/plans/in-progress/`. Update each plan's `Status:` frontmatter and `Paired plan:` path, and repoint the ADR's `Related plans:` paths to the new folder.

## Alternatives Considered

- **Stay in `draft/` while implementing** — rejected. Violates the strict folder rule that the directory tree must reflect lifecycle.
- **Skip straight to `done/` at the end** — rejected. `in-progress/` is the documented signal that implementation is active.

## Consequences

- **Positive:** folder tree accurately reflects active work; matching ADR/plan paths stay consistent.
- **Negative / accepted costs:** the 0005 plan files were not yet committed, so the relocation is a plain `mv` and will show up as a fresh add at the new path once committed.
- **Follow-ups required:** at completion, perform the matching `in-progress/` → `done/` transition with its own decision log entry, bumping ADR 0005 and decision 2026-05-21-004 from `proposed` to `accepted`.
