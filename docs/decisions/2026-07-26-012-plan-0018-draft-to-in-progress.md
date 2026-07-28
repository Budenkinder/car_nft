---
date: 2026-07-26
scope: frontend
status: accepted
related_adr: 0018-unpin-ipfs-on-mint-failure
supersedes: none
---

## Context

User replied `autonomous` to plan 0018 (compensating unpin when on-chain mint fails after a successful IPFS pin), which approves and starts implementation in one step.

## Decision

Move both `0018-unpin-ipfs-on-mint-failure-frontend.md` and `0018-unpin-ipfs-on-mint-failure-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0018's `Related plans:` paths to match.

## Alternatives considered

None — standard draft → in-progress transition, same pattern as prior plans this session.

## Consequences

- Plan 0018 trio now lives in `docs/plans/in-progress/`.
- Code change to `pinata_ipfs_nft_service.js` proceeds next.
