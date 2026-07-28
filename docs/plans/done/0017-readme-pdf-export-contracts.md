# Plan 0017 — README PDF export — Contracts

- **ADR:** `docs/adr/0017-readme-pdf-export.md`
- **Paired plan:** `docs/plans/done/0017-readme-pdf-export-frontend.md`
- **Status:** done
- **Date:** 2026-07-26

## Scope and Goals

No contract code changes. Copy the already-generated `README.pdf` (built from the session scratchpad via a `marked` + `pdfkit` script, verified page-by-page for correct Unicode/box-drawing rendering, list alignment, and blockquote indentation) into `docs/README.pdf`. Filed under the contracts plan by convention only (matches ADR 0015's precedent for owning docs/-artifact placement tasks) — the content itself is not contracts-specific.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `docs/README.pdf` | add | Generated PDF export of the repo-root `README.md`. Static snapshot — see ADR 0017's drift-risk note. |

## Tasks

- [x] **1.** Copy the generated PDF from the session scratchpad into `docs/README.pdf`.

## Contract Surface

Unchanged.

## Interfaces with Frontend

Unchanged.

## Testing

Not applicable — already visually verified page-by-page (8 pages) during generation.

## Deployment and Migration

Not applicable.

## Risks and Rollback

- Risk: none — additive, non-executable file.
- Rollback: `git rm docs/README.pdf`.

## Open Questions

None.
