# ADR 0022: Document the compensating-unpin behavior in README's Architecture write flow

- **Status:** accepted
- **Date:** 2026-07-28
- **Scope:** frontend
- **Related plans:**
  - `docs/plans/in-progress/0022-document-compensating-unpin-in-readme-frontend.md`
  - `docs/plans/in-progress/0022-document-compensating-unpin-in-readme-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-28-006-document-compensating-unpin-in-readme.md`

## Context

README.md's "Architecture" section describes the write flow in five numbered steps (pin to IPFS → `storeCid` → reward → read). It predates ADR 0018 ("Compensating unpin when on-chain mint fails after a successful IPFS pin"), which shipped a real behavior change: if `storeCid` fails after the IPFS pin already succeeded, `handleNFTCreation` now unpins that CID from Pinata before re-throwing the original error (`frontend/src/utils/pinata_ipfs_nft_service.js:237-250`). Plan 0018's task list never included a README update, so this shipped behavior was never reflected in the doc — confirmed by grepping both ADR 0018 and its plans for "README" (no hits).

The user asked whether the Architecture section is "still valid" given that a failed VIN creation now removes the CID's pin. It is valid as far as it goes (the happy path it describes is accurate), but it's incomplete: a reader relying on this section would not know that failed mints are cleaned up automatically, which matters for anyone debugging "why did this pin disappear" or extending the mint flow.

## Decision

Add one new numbered step to the "Write flow" list, immediately after the existing `storeCid` step, describing the compensating unpin on failure — renumbering the two steps after it. No code changes; ADR 0018 already implemented the actual behavior, this ADR only closes the documentation gap it left open.

## Options Considered

### Option A — Add a numbered step to the existing write-flow list (chosen)
- **Pros:** Matches the existing section's style exactly (it already documents conditional/best-effort behavior this way, e.g. the current step 4's "best-effort — silent on failure" for the reward). Minimal, precise, easy to keep in sync going forward.
- **Cons:** None significant.

### Option B — Redraw the ASCII architecture diagram with an explicit failure/rollback arrow
- **Pros:** Would make the rollback path visible at a glance, not just in the numbered text.
- **Cons:** The diagram is a simple steady-state box-and-arrow sketch; every other conditional/error-path detail in this section (reward's silent-failure behavior, POC-open updates) lives in the numbered text, not the diagram. Adding a conditional arrow here would be disproportionate clutter for a POC-level diagram. Rejected — inconsistent with the section's existing pattern.

### Option C — Leave the README as-is
- **Pros:** Zero effort.
- **Cons:** The gap is real and was explicitly flagged — leaving it risks misleading anyone debugging orphaned-pin behavior or extending the mint flow. Rejected.

## Consequences

- **Positive:** README's write flow now accurately reflects shipped behavior (ADR 0018). Closes a documentation gap that ADR 0018's own plan left open.
- **Negative:** None — pure documentation correction, no behavior change.
- **Frontend impact:** `README.md` text only.
- **Contracts impact:** None — see the paired contracts plan (no-op).
- **Follow-ups:** None.

## References

- ADR 0018 (`docs/adr/0018-unpin-ipfs-on-mint-failure.md`) — the behavior this ADR documents.
- `frontend/src/utils/pinata_ipfs_nft_service.js:237-250` (`handleNFTCreation`'s catch-and-unpin block).
