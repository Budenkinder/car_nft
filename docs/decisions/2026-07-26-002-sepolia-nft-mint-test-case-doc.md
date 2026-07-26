---
date: 2026-07-26
scope: both
status: accepted
related_adr: 0015-sepolia-nft-mint-test-case-doc
supersedes: none
---

## Context

User asked for the generated Sepolia NFT-mint test-case PDF (originally written to the session scratchpad) to be placed into the repo's `docs/` tree so it's tracked and discoverable, rather than living only in a temporary session directory.

## Decision

Create a new `docs/testing/` subfolder, mirroring the existing `docs/deployments/` convention of holding generated/reference artifacts outside `adr/`, `plans/`, `decisions/`, and `memory/`. Commit the PDF as `docs/testing/sepolia-nft-mint-test-case.pdf`.

## Alternatives considered

- Drop the PDF loose in `docs/` root — rejected, breaks the existing convention that `docs/` root only holds subfolders, not loose files.
- Convert to Markdown instead of a binary PDF — rejected, contradicts the user's explicit request for a PDF.

## Consequences

- New `docs/testing/` folder established as the home for future manual test-case documents.
- PDF is binary, so future revisions replace the file wholesale rather than diffing — acceptable for an infrequently-updated reference doc.
- No frontend or contracts code touched.
