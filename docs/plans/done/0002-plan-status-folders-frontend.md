# Plan 0002 — Segregate Plans by Status into Subfolders — Frontend

- **ADR:** `docs/adr/0002-plan-status-folders.md`
- **Paired plan:** `docs/plans/done/0002-plan-status-folders-contracts.md`
- **Status:** done
- **Date:** 2026-05-19

## Scope and Goals

**No changes required to `frontend/` code.** This is a docs/workflow change only — ABI unchanged, no UI surface touched, no React state model touched.

The actionable docs-and-workflow tasks for this ADR are captured here (rather than in the contracts plan) by convention: when a request is neither frontend nor contracts code, the actionable tasks live in the frontend plan and the contracts plan is the no-op. This file therefore covers:

1. Creating the new status subfolders under `docs/plans/`.
2. Migrating the existing plan trio (`0001`) and templates into the new structure.
3. Updating `CLAUDE.md`, `docs/plans/README.md`, and the plan templates to document the new rule.
4. Updating ADR `0001`'s `Related plans:` cross-references to match the new locations.
5. Updating ADR `0002`'s own `Related plans:` cross-references after this trio moves out of root.

Out of scope:

- No automation script (`scripts/plan-status.sh`) — deferred until friction is real.
- No retroactive re-statusing of plan `0001` (it stays `draft`; the file simply moves to `draft/`).
- No changes to the decision log file format or to memory file format.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `docs/plans/draft/` | add (mkdir + README) | new status folder; `README.md` describes "plans here are proposed but not yet approved" |
| `docs/plans/approved/` | add (mkdir + README) | "plans here have been approved by the user and are ready to implement" |
| `docs/plans/in-progress/` | add (mkdir + README) | "plans here are actively being implemented; tasks may be partly checked off" |
| `docs/plans/done/` | add (mkdir + README) | "plans here are fully implemented; preserved for look-back" |
| `docs/plans/rejected/` | add (mkdir + README) | "plans here were proposed but not adopted; preserved for look-back" |
| `docs/plans/draft/_template-frontend.md` | move from `docs/plans/_template-frontend.md` | template lives in `draft/` since new plans start as drafts |
| `docs/plans/draft/_template-contracts.md` | move from `docs/plans/_template-contracts.md` | same |
| `docs/plans/draft/0001-frontend-theme-mode-toggle-frontend.md` | move from `docs/plans/0001-frontend-theme-mode-toggle-frontend.md` | existing plan, currently `draft` |
| `docs/plans/draft/0001-frontend-theme-mode-toggle-contracts.md` | move from `docs/plans/0001-frontend-theme-mode-toggle-contracts.md` | existing plan, currently `draft` |
| `docs/plans/draft/0002-plan-status-folders-frontend.md` | move from `docs/plans/0002-plan-status-folders-frontend.md` | this file; this trio is also `draft` |
| `docs/plans/draft/0002-plan-status-folders-contracts.md` | move from `docs/plans/0002-plan-status-folders-contracts.md` | same |
| `docs/plans/README.md` | modify | document the status → folder convention; update template links |
| `docs/adr/0001-frontend-theme-mode-toggle.md` | modify | rewrite `Related plans:` paths to point inside `draft/` |
| `docs/adr/0002-plan-status-folders.md` | modify | rewrite this ADR's own `Related plans:` paths after the move |
| `CLAUDE.md` | modify | enumerate the five statuses, document folder-per-status rule, update all `docs/plans/NNNN-…` example paths to `docs/plans/<status>/NNNN-…`, document the status-transition workflow (mv + ADR link rewrite + decision log entry) |

## Tasks

Execute in order. Each task is independently reviewable.

- [x] **1.** Create the five status subfolders (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`) under `docs/plans/`, each with a short `README.md` describing what "plans here" means and what the entry/exit conditions are.
- [x] **2.** Move the two plan templates from `docs/plans/_template-{frontend,contracts}.md` into `docs/plans/draft/` (preserving filenames). Update `docs/plans/README.md` to point at the new locations and to document the new convention.
- [x] **3.** Update the templates' header `Status:` line to list all five statuses: `draft | approved | in-progress | done | rejected`.
- [x] **4.** Move plan trio `0001` (both `-frontend.md` and `-contracts.md`) from root into `docs/plans/draft/`. (Plain `mv` used because `docs/` is fully untracked at time of migration — no git history to preserve yet.)
- [x] **5.** Rewrite ADR `0001`'s `Related plans:` paths to the new `docs/plans/draft/0001-…` locations.
- [x] **6.** Move plan trio `0002` (this file + its contracts pair) from root into `docs/plans/draft/`.
- [x] **7.** Rewrite ADR `0002`'s `Related plans:` paths.
- [x] **8.** Update `CLAUDE.md`:
  - In "Always start with ADR + Plans", change example paths from `docs/plans/NNNN-<slug>-{frontend,contracts}.md` to `docs/plans/<status>/NNNN-<slug>-{frontend,contracts}.md`.
  - Add a new section **2a. Plan statuses and folders** enumerating the five statuses, the folder-per-status rule, the "both plans in a trio share a folder" rule, and the "status transition = `git mv` + frontmatter + paired-plan + ADR link rewrite + decision log entry" workflow.
  - Note that `rejected` is independent of ADR status — the ADR may stay `proposed`/`accepted` while its plan is `rejected`.
- [x] **9.** Update `docs/plans/README.md`: status table + new convention + link to `CLAUDE.md` section 2a.
- [x] **10.** Decision log entry for the migration folded into the existing `2026-05-19-002-plan-status-folders.md` as an addendum (per the in-plan default — no separate decision file created).
- [x] **11.** Memory file `docs/memory/frontend/plan-status-folders.md` updated: invalid `[[adr-0002]]` / `[[claude-md]]` link tokens replaced with plain prose references; "Until CLAUDE.md is amended" note removed (CLAUDE.md is now amended).

## Interfaces with Contracts

None. No ABI, address, event, or RPC interaction. The contracts plan (`docs/plans/0002-plan-status-folders-contracts.md`, soon `docs/plans/draft/0002-plan-status-folders-contracts.md`) records this with a one-line justification.

## Testing

This is a docs-only change. No automated tests. Manual verification:

- `git status` after each `git mv` step shows the rename, not a delete + add.
- `git log --follow docs/plans/draft/0001-frontend-theme-mode-toggle-frontend.md` returns the file's full history (confirms `git mv` preserved blame).
- All links in modified files (`CLAUDE.md`, `docs/plans/README.md`, ADRs `0001` and `0002`) resolve when clicked in GitHub / VS Code preview.
- `grep -r "docs/plans/0001-frontend-theme-mode-toggle" .` after the migration returns zero references to the old root paths (excluding decision log entries, which intentionally preserve historical paths).

## Risks and Rollback

- **Risk:** ADR links to plan files go stale if step 5 or step 7 is skipped. Mitigation: those steps are explicit, and the migration decision log entry is the checkpoint.
- **Risk:** A future tool that hardcodes `docs/plans/NNNN-*` glob patterns breaks. Mitigation: no such tool exists in the repo today (`grep -r "docs/plans/" . --include="*.sh" --include="*.js"` returns nothing actionable); revisit if one is added.
- **Risk:** The user later wants per-status numbering instead of global. Cost to undo: rename files; cheap.
- **Rollback:** revert the migration PR. All moves are `git mv`s so revert is mechanical; ADR link rewrites revert with the same revert.

## Open Questions

- Does the user want the templates copied into each status folder, or only into `draft/`? **Default in this plan: only `draft/`.** A plan only enters another status by being promoted from `draft/`, never created fresh there.
- Does the user want a separate `superseded/` status for plans whose ADR was superseded but which were never themselves rejected? **Default: no — fold into `rejected/`** with a note in the plan body explaining "superseded by ADR NNNN".
- Should rejected plans also have their ADR marked `superseded`? **Default: no — leave the ADR status alone unless an explicit replacement ADR exists.** The plan being `rejected` and the ADR being `proposed` (forever) is a valid combination meaning "we considered it and decided not to do it".
