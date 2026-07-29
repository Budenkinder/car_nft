---
date: 2026-07-29
scope: both
status: accepted
related_adr: 0027-nft-transaction-provenance-link
supersedes: none
---

## Context

User replied "Now implement 0027 autonomously", which per `CLAUDE.md` both approves and starts implementation in one step.

## Decision

Move both `0027-nft-transaction-provenance-link-frontend.md` and `-contracts.md` from `docs/plans/draft/` to `docs/plans/in-progress/`, update their `Status:` frontmatter and `Paired plan:` paths, and update ADR 0027's `Related plans:` paths to match — following the established draft → in-progress precedent. ADR 0027 stays `proposed`; it bumps to `accepted` once the plan reaches `done`.

The plan's Open Question (whether "Show All Registered NFTs" should also get a per-row transaction link) is explicitly out of scope for this plan per its own Scope and Goals section, so it does not block implementing the plan as written.

Pre-implementation verification against the live repo confirmed the plan's assumptions still hold: `CidStored(string vin, string cid, uint256 tokenId)` (`contracts/car_nft_sc.sol:28`) has no indexed fields, matching Option A's premise; `scripts/deploy.js`'s structure (artifact object, `upsertEnvVar` helper, Sepolia deploy log) matches the cited line ranges; `web3` is pinned to `^4.16.0`, which supports `contract.getPastEvents`.

## Alternatives considered

- Route through `docs/plans/approved/` first — rejected as unnecessary ceremony, matching established precedent.

## Consequences

- Plan 0027 trio now lives in `docs/plans/in-progress/`.
- Implementation proceeds contracts-first (deploy-block sync), then frontend (event query + UI), since the frontend's `getContractDeployBlock` helper depends on the env var the contracts-side deploy script change introduces.
