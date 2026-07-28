# ADR 0015: Add Sepolia NFT-mint test case as a tracked PDF under docs/

- **Status:** accepted
- **Date:** 2026-07-26
- **Scope:** both
- **Related plans:**
  - `docs/plans/done/0015-sepolia-nft-mint-test-case-doc-frontend.md`
  - `docs/plans/done/0015-sepolia-nft-mint-test-case-doc-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-26-002-sepolia-nft-mint-test-case-doc.md`

## Context

A manual test-case document was generated (connect via Sepolia → submit VIN/car data → mint NFT → verify token visibility), plus background explaining Hardhat/Sepolia/MetaMask chain IDs and the dev container's role. The user asked for this to be placed into `docs/` so it's tracked alongside the rest of the project's documentation, rather than living only in the session scratchpad.

This is a documentation-only addition — it doesn't add, remove, or change any file under `frontend/` or `contracts/`, doesn't touch an ABI, event, or deployed address, and isn't reversing/superseding any prior decision. The only real decision is *where* a binary artifact like a PDF belongs in the existing `docs/` layout.

## Decision

Add a new `docs/testing/` subfolder (parallel to the existing `docs/deployments/` pattern of holding generated, dated artifacts outside `adr/`, `plans/`, `decisions/`, `memory/`) and commit the PDF there as `docs/testing/sepolia-nft-mint-test-case.pdf`.

## Options Considered

### Option A — New `docs/testing/` folder (chosen)
- **Pros:** Mirrors the existing `docs/deployments/` convention for generated/reference artifacts that aren't ADRs, plans, decisions, or memory; easy to find; room to add more test cases later without cluttering `docs/` root.
- **Cons:** Introduces a new top-level docs subfolder.

### Option B — Drop the PDF directly in `docs/` root
- **Pros:** No new folder.
- **Cons:** `docs/` root is otherwise empty of loose files (everything is already segregated into `adr/`, `plans/`, `decisions/`, `memory/`, `deployments/`); would break that convention.

### Option C — Convert to Markdown instead of committing a binary PDF
- **Pros:** Diff-friendly, no binary blob in git history.
- **Cons:** User explicitly asked for a PDF; converting away from that isn't what was requested.

## Consequences

- **Positive:** Test case is discoverable and versioned alongside the rest of the project's docs.
- **Negative:** PDFs are binary — future edits replace the whole file rather than diffing cleanly. Acceptable for an infrequently-updated reference document.
- **Frontend impact:** None — no code touched.
- **Contracts impact:** None — no code touched.
- **Follow-ups:** If more manual test cases are written later, they belong in the same `docs/testing/` folder.

## References

- `docs/deployments/` — existing precedent for a generated-artifact subfolder under `docs/`.
