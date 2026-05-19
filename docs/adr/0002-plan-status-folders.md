# ADR 0002: Segregate Plans by Status into Subfolders (and add `rejected` status)

- **Status:** accepted
- **Date:** 2026-05-19
- **Scope:** both (workflow / docs only — no code in `frontend/` or `contracts/`)
- **Related plans:**
  - `docs/plans/done/0002-plan-status-folders-frontend.md`
  - `docs/plans/done/0002-plan-status-folders-contracts.md`
- **Related decisions:** `docs/decisions/2026-05-19-002-plan-status-folders.md`

## Context

The user asked for a rule change to how plan files are stored:

1. Plans should be **segregated by status** — e.g., a plan whose status is `draft` lives in a `draft/` folder.
2. A new status, **`rejected`**, must be added to cover plans that were proposed but not adopted, so we have a record to look back on.
3. The decision log and project memory must continue to be updated as part of the workflow.

Current state:

- All plan files live flat under `docs/plans/`, with `_template-frontend.md` and `_template-contracts.md` defining the in-file status field as `draft | approved | in-progress | done`.
- Only one plan trio exists today: ADR `0001` and its two plan files (`0001-frontend-theme-mode-toggle-{frontend,contracts}.md`), both in `draft` status.
- ADRs in `docs/adr/` reference their plans by hard-coded relative paths.
- `CLAUDE.md` codifies the existing rule ("Save these under `docs/adr/` and `docs/plans/`…") and is the authoritative source for the workflow.

The decision is needed now because the user has explicitly asked for the rule change, and any further plans should be written into the new structure from the start.

## Decision

Adopt **one subfolder per plan status** under `docs/plans/`, with **physical file moves** when status changes. The plan trio's frontmatter `Status:` field remains the source of truth; the folder is a mirror that makes "what's still open vs. what shipped vs. what we rejected" visible at a glance.

Concrete rules:

- Statuses become: `draft | approved | in-progress | done | rejected`.
  - `rejected` is new and is terminal — it means the plan was proposed but **not** adopted (the ADR may be marked `superseded` or stay `proposed`; the plan itself is `rejected`).
  - `done` is also terminal — the plan was fully implemented.
- For each status there is a corresponding subfolder under `docs/plans/`:
  - `docs/plans/draft/`
  - `docs/plans/approved/`
  - `docs/plans/in-progress/`
  - `docs/plans/done/`
  - `docs/plans/rejected/`
- **Numbering stays global.** Plan filenames keep the form `NNNN-<slug>-{frontend,contracts}.md`, with `NNNN` sequential across **all** plans regardless of status. This preserves the "find the ADR and plans by `NNNN`" property.
- **The two plans in a trio always share a folder.** When a request's frontend plan moves from `draft/` to `approved/`, the contracts plan moves with it, even if it is a no-op. They are reviewed and executed in lockstep; their location should reflect that.
- **Templates move into `draft/`** and are renamed to keep the leading-underscore convention so they don't collide with numbered plans: `docs/plans/draft/_template-frontend.md`, `docs/plans/draft/_template-contracts.md`. Each status subfolder gets a short `README.md` describing what "lives here" means.
- **Status field stays canonical.** If the frontmatter `Status:` disagrees with the folder, the frontmatter wins; fix the folder. The decision log captures every status transition (one decision file per transition) so we always have a written trail.
- **ADR cross-links must be updated** as part of a status move. When a plan moves between folders, the matching ADR's `Related plans:` paths are rewritten in the same change. The decision log entry recording the move documents this.
- **Looking back** — the requested "way to look back" — is the `done/` and `rejected/` folders themselves, plus the decision log index newest-first. No separate archive system.

## Options Considered

### Option A — One subfolder per status, files physically move with status (chosen)

- **Pros:** matches the user's stated requirement verbatim ("segregated based on status"); a single `ls docs/plans/done/` answers "what shipped?"; `ls docs/plans/rejected/` answers "what did we walk away from and why?"; no new tooling required.
- **Cons:** every status transition is a `git mv` of two files + an ADR link rewrite + a decision log entry. Discipline-heavy. ADR cross-references need to stay in sync.

### Option B — Plans stay flat; introduce an index file per status

- **Pros:** zero file moves; ADR links never break.
- **Cons:** doesn't actually segregate — the user asked for folders, not indexes. Indexes drift from reality unless we add tooling to regenerate them. Rejected because it doesn't satisfy the stated requirement.

### Option C — Plans flat; symlink farms in `docs/plans/<status>/`

- **Pros:** preserves canonical path under `docs/plans/NNNN-…`; gives the folder view.
- **Cons:** symlinks behave poorly on Windows and in some GitHub renderings; adds a layer that's easy to forget to keep in sync; not noticeably simpler than physical moves.

### Option D — Terminal-only folders (`done/`, `rejected/`); active plans flat at the root

- **Pros:** fewer moves (each plan moves at most twice: into `done/` or `rejected/`); preserves stable paths for the common case.
- **Cons:** user explicitly used `draft` as the example, implying every status has a folder. Rejecting this for fidelity to the request.

## Consequences

- **Positive:**
  - "Look back" is trivial: `ls docs/plans/done/` and `ls docs/plans/rejected/`.
  - State of the project is visible from the directory tree, not just frontmatter.
  - Rejected plans are preserved as first-class artifacts, not deleted — useful for future "we tried this before, here's why we didn't ship it" questions.
- **Negative / accepted costs:**
  - Status transitions are heavier: two `git mv`s, an ADR link rewrite, a decision log entry, possibly a memory update. We accept this cost in exchange for the clarity.
  - ADR `Related plans:` paths can go stale if a status transition skips the rewrite. Mitigation: the decision log entry for each transition is the checkpoint where this gets caught.
- **Frontend impact:** none. No code in `frontend/` changes. The frontend plan (`docs/plans/draft/0002-plan-status-folders-frontend.md`) records this.
- **Contracts impact:** none. No code in `contracts/`, `scripts/`, or `hardhat.config.js` changes. The contracts plan records this.
- **`CLAUDE.md` impact:** the "Always start with ADR + Plans" section needs its plan-path examples updated; the "Workflow Rules" section gets a new subsection enumerating statuses and the folder-per-status rule. Templates and `docs/plans/README.md` are updated to match.
- **Existing plan 0001:** must be physically moved from `docs/plans/0001-frontend-theme-mode-toggle-{frontend,contracts}.md` to `docs/plans/draft/0001-frontend-theme-mode-toggle-{frontend,contracts}.md`, and ADR `0001`'s `Related plans:` field rewritten. This is a one-shot migration task in the frontend plan below (executed as a docs change; no code).
- **Follow-ups:**
  - None required beyond the migration. If status transitions turn out to be too error-prone in practice, a small script (`scripts/plan-status.sh NNNN <new-status>`) could automate the mv + ADR link rewrite. Not building it yet — wait until the friction is real.

## References

- User's rule change in chat on 2026-05-19.
- Plan templates: [docs/plans/draft/_template-frontend.md](../plans/draft/_template-frontend.md), [docs/plans/draft/_template-contracts.md](../plans/draft/_template-contracts.md).
- Plan trio 0001 (still in `draft/` since the theme-toggle feature itself has not been implemented yet): [docs/plans/draft/0001-frontend-theme-mode-toggle-frontend.md](../plans/draft/0001-frontend-theme-mode-toggle-frontend.md), [docs/plans/draft/0001-frontend-theme-mode-toggle-contracts.md](../plans/draft/0001-frontend-theme-mode-toggle-contracts.md).
- This ADR's own plan trio (post-migration, post-implementation, in `done/`): [docs/plans/done/0002-plan-status-folders-frontend.md](../plans/done/0002-plan-status-folders-frontend.md), [docs/plans/done/0002-plan-status-folders-contracts.md](../plans/done/0002-plan-status-folders-contracts.md).
- Workflow rules: [CLAUDE.md](../../CLAUDE.md).
