---
date: 2026-07-29
scope: frontend
status: accepted
related_adr: 0024-readme-crt-metamask-import
supersedes: none
---

## Context

Plan 0024 (README: CRT MetaMask import) had all tasks checked `[x]` on both sides and no open questions. The user asked for all `in-progress` plans to be reviewed and moved to the correct status if complete.

## Decision

Verified against the live repo: `README.md` contains the "CRT (ERC-20) reward balance" note (line 179), the matching Troubleshooting bullet (line 348), and the corrected Sepolia addresses in "Reference deployment (Sepolia)" (lines 233-234) — both addresses (`CarRewardToken` `0xABdC5742FFe7E34Af79f08E46D099Fd9bE3bC68c`, `VinCidRegistry` `0x089711b304ad2E279843588F7051AFe59797CdB8`) match `deployments/sepolia.json`'s `rewardToken` and `registry` fields exactly. Transitioned plan 0024 (both `-frontend.md` and `-contracts.md`) from `in-progress` to `done`:

1. `git mv` both files to `docs/plans/done/`.
2. Updated both files' `Status:` frontmatter to `done` and `Paired plan:` paths to the new folder.
3. Rewrote ADR 0024's `Related plans:` paths to point at `docs/plans/done/`.

## Alternatives considered

- None — documentation-only change, already merged and verified against the live file and deployment record.

## Consequences

`docs/plans/done/` now reflects that this documentation fix has shipped.
