---
date: 2026-07-26
scope: both
status: accepted
related_adr: 0016-readme-hardhat-nft-visibility
supersedes: none
---

## Context

User replied `autonomous` to plan 0016 (document Hardhat ETH-vs-NFT visibility in README), which approves and starts implementation in one step.

## Decision

Move both `0016-readme-hardhat-nft-visibility-frontend.md` and `0016-readme-hardhat-nft-visibility-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0016's `Related plans:` paths to match.

## Alternatives considered

None — standard draft → in-progress transition, same pattern as plans 0011, 0012, 0015.

## Consequences

- Plan 0016 trio now lives in `docs/plans/in-progress/`.
- README edit proceeds next.
