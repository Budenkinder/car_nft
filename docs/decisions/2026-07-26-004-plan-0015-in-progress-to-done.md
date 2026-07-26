---
date: 2026-07-26
scope: both
status: accepted
related_adr: 0015-sepolia-nft-mint-test-case-doc
supersedes: none
---

## Context

The single task in plan 0015 (contracts side) — copy the generated Sepolia NFT-mint test-case PDF into `docs/testing/sepolia-nft-mint-test-case.pdf` — is complete.

## Decision

Move both `0015-sepolia-nft-mint-test-case-doc-frontend.md` and `0015-sepolia-nft-mint-test-case-doc-contracts.md` from `docs/plans/in-progress/` to `docs/plans/done/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0015's `Related plans:` paths to match. ADR 0015 was already `accepted` (not `proposed`), so no ADR status bump is needed on this transition.

## Alternatives considered

None — straightforward completion of a single-task plan.

## Consequences

- Plan 0015 trio now lives in `docs/plans/done/`.
- `docs/testing/sepolia-nft-mint-test-case.pdf` exists and is ready to be staged/committed by the user.
