---
date: 2026-07-26
scope: both
status: accepted
related_adr: 0016-readme-hardhat-nft-visibility
supersedes: none
---

## Context

Both tasks in plan 0016 are complete: `README.md` now explains the ETH-vs-NFT visibility gap in the "Option 1 — Local deploy" section and has a matching Troubleshooting bullet. The contracts-side task (verifying the README's `_tokenIdFromVin` description against the actual code) confirmed an exact match.

## Decision

Move both `0016-readme-hardhat-nft-visibility-frontend.md` and `0016-readme-hardhat-nft-visibility-contracts.md` from `docs/plans/in-progress/` to `docs/plans/done/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0016's `Related plans:` paths to match. ADR 0016 was already `accepted`, so no status bump needed.

## Alternatives considered

None — completion of a two-task plan.

## Consequences

- Plan 0016 trio now lives in `docs/plans/done/`.
- `README.md` documents the ETH-vs-NFT MetaMask visibility gap for future contributors.
