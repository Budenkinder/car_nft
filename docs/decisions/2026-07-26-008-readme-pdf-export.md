---
date: 2026-07-26
scope: both
status: accepted
related_adr: 0017-readme-pdf-export
supersedes: none
---

## Context

User asked for the generated `README.md` PDF export (built earlier this session via `marked` + `pdfkit` after a headless-Chromium approach was ruled out for needing a heavier system-dependency install) to be committed into the repo, same pattern as ADR 0015's test-case PDF.

## Decision

Commit it as `docs/README.pdf` (docs root, not a new subfolder — it's a 1:1 export of the root `README.md`, not a recurring artifact category). Note explicitly that this is a static snapshot with no auto-regeneration; it will drift from `README.md` after the next edit unless manually re-exported.

## Alternatives considered

- New `docs/exports/` subfolder — rejected as overkill for a single file.

## Consequences

- `docs/README.pdf` exists as a shareable/printable snapshot of the README.
- Staleness risk accepted, no automation added.
- No frontend or contracts code touched.
