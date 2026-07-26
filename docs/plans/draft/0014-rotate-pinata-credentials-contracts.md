# Plan 0014 — Rotate Pinata credentials — Contracts

- **ADR:** `docs/adr/0014-rotate-pinata-credentials.md`
- **Paired plan:** `docs/plans/draft/0014-rotate-pinata-credentials-frontend.md`
- **Status:** draft
- **Date:** 2026-07-26

## Scope and Goals

No changes required. Pinata credentials are a frontend-only IPFS pinning concern (`REACT_APP_PINATA_JWT`, read in `frontend/src/utils/pinata_ipfs_nft_service.js`); nothing in `contracts/`, `scripts/`, `hardhat.config.js`, or `deployments/` references Pinata, IPFS, or any of the rotated values.

## Files to Add / Modify

None.

## Tasks

None — no contracts-side work for this request.

## Contract Surface

Unchanged.

## Interfaces with Frontend

Unchanged — the registry contract stores/returns CIDs (`storeCid`, `getCidByVin`) but has no knowledge of how those CIDs were pinned or which Pinata credentials produced them.

## Testing

Not applicable.

## Deployment and Migration

Not applicable.

## Risks and Rollback

None.

## Open Questions

None.
