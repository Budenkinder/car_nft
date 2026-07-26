---
date: 2026-07-26
scope: both
status: accepted
related_adr: 0015-sepolia-nft-mint-test-case-doc
supersedes: none
---

## Context

User replied `autonomous` to plan 0015 (add the Sepolia NFT-mint test-case PDF to `docs/testing/`), which per `CLAUDE.md` both approves and starts implementation in one step.

## Decision

Move both `0015-sepolia-nft-mint-test-case-doc-frontend.md` and `0015-sepolia-nft-mint-test-case-doc-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0015's `Related plans:` paths to match — following the same draft → in-progress pattern used previously (e.g. plan 0011, plan 0012) rather than routing through a separate `approved` stage.

## Alternatives considered

- Route through `docs/plans/approved/` first — rejected as unnecessary ceremony; matches this repo's established precedent of trigger words (`implement`/`autonomous`) serving as both approval and start-of-work.

## Consequences

- Plan 0015 trio now lives in `docs/plans/in-progress/`.
- Implementation of the single contracts-side task (copy PDF into `docs/testing/`) proceeds next.
