# ADR 0017: Commit generated README.md PDF export under docs/

- **Status:** accepted
- **Date:** 2026-07-26
- **Scope:** both
- **Related plans:**
  - `docs/plans/done/0017-readme-pdf-export-frontend.md`
  - `docs/plans/done/0017-readme-pdf-export-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-26-008-readme-pdf-export.md`

## Context

A PDF rendering of `README.md` was generated (via a `marked` + `pdfkit` Node script, after headless-Chromium rendering turned out to need a heavier system-dependency install than was worth doing without asking — see prior chat turn) and the user asked for it to be committed into the repo, following the same pattern as ADR 0015's test-case PDF.

This is a documentation-only addition: a static, point-in-time PDF export of `README.md`. It does not modify `frontend/` or `contracts/`.

## Decision

Commit the PDF as `docs/README.pdf` — at `docs/` root (not a new subfolder), since it's a 1:1 export of the repo-root `README.md` rather than a category of recurring artifacts like `docs/deployments/` or `docs/testing/`.

Explicitly note the drift risk: this is a static snapshot, not auto-regenerated on every `README.md` change. It will go stale the next time README is edited unless someone re-runs the export and re-commits. No CI/automation is being added to keep it in sync — out of scope unless requested separately.

## Options Considered

### Option A — `docs/README.pdf` at docs root (chosen)
- **Pros:** Mirrors the source file's name and location one level down; obviously "the PDF version of the README" without needing a folder to explain it.
- **Cons:** `docs/` root otherwise only holds subfolders (per ADR 0015's Option B rejection) — this is a deliberate, narrow exception because this file is a 1:1 export of a root-level file, not a new category of generated artifact.

### Option B — New `docs/exports/` subfolder
- **Pros:** Keeps `docs/` root subfolder-only, consistent with ADR 0015.
- **Cons:** Overkill for a single file with no other artifacts expected to join it.

## Consequences

- **Positive:** README content is available as a shareable/printable PDF.
- **Negative:** Static snapshot — will silently go stale after the next `README.md` edit unless manually regenerated. No automation added to prevent this.
- **Frontend impact:** None.
- **Contracts impact:** None.
- **Follow-ups:** If staleness becomes a real problem, consider a CI step to regenerate on `README.md` changes — not done now, no such request made.

## References

- ADR 0015 (precedent for committing a generated PDF under `docs/`)
