---
date: 2026-07-29
scope: frontend
status: accepted
related_adr: 0018-unpin-ipfs-on-mint-failure
supersedes: none
---

## Context

Plan 0018 (unpin IPFS entry on mint failure) sat in `docs/plans/in-progress/` with its only open item being a manual verification step (task 3) that required a real browser, MetaMask, and a live Pinata account — unavailable in the assistant's sandbox. The code itself (`unpinFromIPFS` helper and the wrapped `storeCidOnBlockchain` call in `frontend/src/utils/pinata_ipfs_nft_service.js`) was committed in `5ac4663`. The user has now confirmed the fix works as intended outside this environment, and asked for the plan's status to be reviewed and corrected.

## Decision

Transition plan 0018 (both `-frontend.md` and `-contracts.md`) from `in-progress` to `done`:

1. `git mv` both files to `docs/plans/done/`.
2. Updated both files' `Status:` frontmatter to `done` and `Paired plan:` paths to the new folder.
3. Marked task 3 in the frontend plan `[x]`, noting the user confirmed the manual verification outside this environment (previously blocked on sandbox limitations, not on the fix itself).
4. Rewrote ADR 0018's `Related plans:` paths to point at `docs/plans/done/`.

## Alternatives considered

- Leave task 3 unchecked and the plan `in-progress` pending a future in-sandbox verification: rejected — no such capability will become available in this environment, and the user's real-world confirmation is the actual acceptance criterion the plan was waiting on.

## Consequences

`docs/plans/done/` now reflects that this fix has shipped and been confirmed. No code changes were made as part of this transition — documentation only.
