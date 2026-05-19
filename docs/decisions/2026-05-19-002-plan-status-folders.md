---
date: 2026-05-19
scope: both
status: accepted
related_adr: 0002-plan-status-folders
supersedes: none
---

# Plan files segregated by status into subfolders; add `rejected` status

## Context

The user asked for a rule change to how plan files are stored: plans should be segregated by status into folders (so a `draft`-status plan lives in `draft/`), and a new `rejected` status must exist so we can look back at plans that were proposed but not adopted. The user also reinforced that decisions and memories must keep being updated.

Current state: plans are flat under `docs/plans/` with status only as a frontmatter field (`draft | approved | in-progress | done`). There is no `rejected` status, and "look back" relies solely on reading file headers.

## Decision

- Introduce one subfolder per status under `docs/plans/`: `draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`.
- Add `rejected` to the status enum. It is terminal: a `rejected` plan means "we proposed it and decided not to ship it". An ADR may stay `proposed` while its plan is `rejected` — these are independent.
- Plan filenames keep the global `NNNN-<slug>-{frontend,contracts}.md` form. Numbering does **not** reset per folder; this preserves "find the plans for ADR `NNNN`" by name.
- Both plans in a trio (`-frontend.md` + `-contracts.md`) always share a folder and move together when status changes.
- Plan templates live in `docs/plans/draft/_template-{frontend,contracts}.md` since every new plan begins as a draft.
- Frontmatter `Status:` is the source of truth. If folder and frontmatter disagree, the frontmatter wins; fix the folder.
- Each status transition is: `git mv` both plan files → rewrite the ADR's `Related plans:` paths → write a new decision log entry recording the transition. The decision log entry is the checkpoint where stale ADR links get caught.
- "Looking back" is satisfied by the `done/` and `rejected/` folders themselves plus the decision log index (newest first). No separate archive system.

## Alternatives Considered

- **Plans flat; per-status index files.** Doesn't segregate as requested; indexes drift without tooling. Rejected.
- **Plans flat; symlinks in `<status>/` folders.** Cross-platform fragility (Windows, GitHub renderings); not noticeably simpler than physical moves. Rejected.
- **Terminal-only folders (`done/`, `rejected/`); active plans flat at the root.** Fewer moves, but the user explicitly used `draft` as the example folder, signalling they want every status to have one. Rejected for fidelity to the request.
- **Per-folder numbering reset.** Breaks the "ADR `NNNN` ↔ plans `NNNN`" lookup property; no upside. Rejected.

## Consequences

- **Positive:** `ls docs/plans/done/` answers "what shipped"; `ls docs/plans/rejected/` answers "what did we walk away from"; rejected plans become first-class artifacts instead of being deleted or forgotten; project state is visible from the directory tree.
- **Negative / accepted costs:** every status transition is a multi-file change (`git mv` × 2 + ADR rewrite + decision log entry). ADR cross-references can go stale if a transition skips the link rewrite — the decision log entry is the mitigation.
- **Migration:** existing plan trio `0001` (currently flat, status `draft`) must move to `docs/plans/draft/`, and ADR `0001`'s `Related plans:` paths must be rewritten. Captured as tasks in the frontend plan for ADR `0002`.
- **CLAUDE.md:** authoritative workflow doc must be amended to enumerate the five statuses, the folder-per-status rule, and the transition workflow. Templates and `docs/plans/README.md` updated to match.
- **Follow-ups:** none required. If status transitions become error-prone in practice, consider a small `scripts/plan-status.sh NNNN <new-status>` helper. Not building it until the friction is real.
- **Memory:** a `feedback`-type memory is added under `docs/memory/frontend/plan-status-folders.md` (scoped frontend by convention since this fact spans both sides) so the rule is recalled in future conversations even if `CLAUDE.md` hasn't been amended yet.

## Addendum — 2026-05-19, plan 0002 transition `draft` → `done`

Per the rule introduced by this decision, every plan-status transition must be recorded in the decision log. The migration itself (the work specified by plan 0002) was completed in the same session as this decision was accepted. Rather than open a second decision file for an immediate transition, the transition is folded in here:

- Plan files `0002-plan-status-folders-{frontend,contracts}.md` moved from `docs/plans/draft/` to `docs/plans/done/`.
- Each file's frontmatter `Status:` updated `draft` → `done`; `**Paired plan:**` path updated to point at `docs/plans/done/…`.
- Every task in the frontend plan (1 through 11) ticked off.
- ADR 0002's `Related plans:` paths rewritten from `docs/plans/draft/…` to `docs/plans/done/…`.
- ADR 0002 status moved `proposed` → `accepted`.
- This decision file's frontmatter status moved `proposed` → `accepted` (above) and its INDEX entry updated.

The "fold a same-session terminal transition into the originating decision" pattern is the exception, not the default — any future transition that happens after the originating decision is committed must be its own decision file.
