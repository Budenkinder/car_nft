---
date: 2026-05-21
scope: frontend
status: accepted
related_adr: 0004-frontend-list-all-registered-nfts
supersedes: none
---

# Plan 0004 transitioned draft → in-progress

## Context

The user approved plan 0004 (list all registered NFTs as VIN → CID) and triggered autonomous implementation via the `autonomous` command. Per CLAUDE.md section 2a, plan status transitions are a multi-file change requiring frontmatter, paired-plan path, ADR links, and a decision log entry to stay consistent.

## Decision

Move both plan files for the 0004 trio from `docs/plans/draft/` to `docs/plans/in-progress/`. Update each plan's `Status:` frontmatter and `Paired plan:` path, and repoint the ADR's `Related plans:` paths to the new folder.

## Alternatives Considered

- **Stay in `draft/` while implementing** — rejected. Violates the strict folder rule that the directory tree must reflect lifecycle.
- **Skip straight to `done/` at the end** — rejected. `in-progress/` is the documented signal that implementation is active; skipping it hides the in-flight state from anyone glancing at `ls docs/plans/`.

## Consequences

- **Positive:** folder tree accurately reflects active work; matching ADR/plan paths stay consistent.
- **Negative / accepted costs:** the 0004 plan files were not yet committed, so the relocation is a plain `mv` (not `git mv`) and will show up as a fresh add at the new path once committed. No history is lost because none exists yet for these files.
- **Follow-ups required:** at completion, perform the matching `in-progress/` → `done/` transition with the same five-step procedure and its own decision log entry, bumping ADR 0004 from `proposed` to `accepted`.
