---
date: 2026-05-21
scope: frontend
status: accepted
related_adr: 0004-frontend-list-all-registered-nfts
supersedes: none
---

# Plan 0004 transitioned in-progress → done; ADR 0004 bumped proposed → accepted

## Context

All implementation tasks (1–5) in plan 0004 (list all registered NFTs as VIN → CID) completed during the autonomous run: `getAllRegisteredNfts(chainId)` added to `frontend/src/utils/pinata_ipfs_nft_service.js` (parallel `getAllVins()` + `getAllCidsAsList()`, zipped by index); `frontend/src/App.js` gained `nftList`/`isLoadingList`/`listLoaded` state, a `handleShowAllNfts` handler, and a new "All Registered Car NFTs" MUI section with a load button, a `List` of VIN → clickable-IPFS-CID rows, and an empty state. The web3.js service-layer convention was recorded in `docs/memory/frontend/web3js-contract-access-pattern.md`. `CI=true npm run build` compiled successfully (lint-clean). Browser/MetaMask verification (live Sepolia + local Hardhat) from the plan's Testing section is deferred to the user.

## Decision

Move the plan trio from `docs/plans/in-progress/` to `docs/plans/done/`, update each plan's `Status:` + `Paired plan:`, repoint the ADR's `Related plans:` paths, and bump ADR 0004's `Status:` from `proposed` to `accepted` since the decision is now realised in code. Decision `2026-05-21-001` (the feature-approach decision) is bumped `proposed` → `accepted` for the same reason.

## Alternatives Considered

- **Leave ADR at `proposed`** — rejected. With both plans `done` and the change shipped in `frontend/src/`, `proposed` would misrepresent the decision's state.
- **Tick task boxes but leave the trio in `in-progress/`** — rejected. Strict folder rule: frontmatter and folder must match, and the folder must reflect lifecycle.

## Consequences

- **Positive:** `ls docs/plans/done/` now shows the shipped 0004 trio; the ADR and the feature decision no longer claim to be merely proposed.
- **Negative / accepted costs:** the browser-level Testing steps (button click against live Sepolia, local-Hardhat mint-then-list, empty-registry state, dark-mode legibility of the CID links) are unverified by the implementation run and remain on the user's side.
- **Follow-ups required:** user should run `cd frontend && npm start`, connect MetaMask, and walk through the frontend plan's Testing section. Pagination for large registries remains an ADR-0004 follow-up.
