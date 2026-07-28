# Plan 0015 — Sepolia NFT-mint test case doc — Contracts

- **ADR:** `docs/adr/0015-sepolia-nft-mint-test-case-doc.md`
- **Paired plan:** `docs/plans/done/0015-sepolia-nft-mint-test-case-doc-frontend.md`
- **Status:** done
- **Date:** 2026-07-26

## Scope and Goals

No changes required. This request adds a reference PDF under `docs/testing/` describing a manual test case; it does not modify any file under `contracts/`, `scripts/`, `hardhat.config.js`, or `deployments/`.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `docs/testing/sepolia-nft-mint-test-case.pdf` | add | Generated reference document, not source code. Tracked at repo root under `docs/`, outside the `contracts/` tree. |

## Tasks

- [x] **1.** Copy the generated PDF from the session scratchpad into `docs/testing/sepolia-nft-mint-test-case.pdf` and `git add` it.

## Contract Surface

Unchanged.

## Interfaces with Frontend

Unchanged.

## Testing

Not applicable — the artifact itself *is* a testing document, not code under test.

## Deployment and Migration

Not applicable.

## Risks and Rollback

- Risk: none — additive, non-executable file.
- Rollback: `git rm docs/testing/sepolia-nft-mint-test-case.pdf`.

## Open Questions

None.
