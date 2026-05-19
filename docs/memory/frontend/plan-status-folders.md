---
name: plan-status-folders
description: Plans are segregated into status subfolders under docs/plans/ (draft/approved/in-progress/done/rejected); both plans in a trio share a folder and move together
metadata:
  type: feedback
  scope: frontend
---

Plans live in **status-named subfolders** under `docs/plans/`, not flat. The five statuses are `draft | approved | in-progress | done | rejected`, each with its own folder (`docs/plans/draft/`, `…/approved/`, `…/in-progress/`, `…/done/`, `…/rejected/`). A plan's frontmatter `Status:` is the source of truth; the folder is a mirror. When status changes, both the `-frontend.md` and `-contracts.md` files for that trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. Plan numbering (`NNNN-…`) stays global across all folders. `rejected` is terminal and is independent of ADR status — an ADR can stay `proposed` while its plan is `rejected`.

**Why:** the user asked for this on 2026-05-19 so the directory tree itself answers "what shipped?" (`ls docs/plans/done/`) and "what did we walk away from?" (`ls docs/plans/rejected/`). Rejected plans must be preserved, not deleted, so we can look back. Captured authoritatively in `docs/adr/0002-plan-status-folders.md` and decision `docs/decisions/2026-05-19-002-plan-status-folders.md`; codified in `CLAUDE.md` section **2a. Plan statuses and folders**.

**How to apply:**
- When writing any new plan trio, place both files in `docs/plans/draft/NNNN-<slug>-{frontend,contracts}.md` from the start.
- When promoting a plan (draft → approved → in-progress → done, or any state → rejected), `git mv` **both** files in the trio to the new folder, update each file's frontmatter `Status:` and `**Paired plan:**` path, rewrite the matching ADR's `Related plans:` paths, and write a decision log entry recording the transition.
- If you find a plan whose frontmatter `Status:` disagrees with its folder, the frontmatter wins — move the file to match.
- Templates live only in `docs/plans/draft/_template-{frontend,contracts}.md`. Don't duplicate them into other status folders.
- This applies equally to frontend plans and contracts plans; scoped under `frontend/` here only because memory entries must pick one side per `CLAUDE.md` section 3.
- Plan numbering (`NNNN`) is global across all status folders — never reset per folder.
