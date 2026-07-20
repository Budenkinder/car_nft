# ADR 0012: Document this session's troubleshooting learnings in README

- **Status:** accepted
- **Date:** 2026-07-20
- **Scope:** both
- **Related plans:**
  - `docs/plans/done/0012-readme-session-learnings-frontend.md`
  - `docs/plans/done/0012-readme-session-learnings-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-20-003-plan-0012-draft-to-in-progress.md`, `docs/decisions/2026-07-20-004-plan-0012-in-progress-to-done.md`

## Context

This conversation surfaced two non-obvious, since-resolved-or-clarified pieces of knowledge that a future contributor (human or another Claude session) would otherwise have to rediscover from scratch, because they aren't yet written down anywhere a human would naturally look:

1. **`npm run compile` printing `No contracts to compile` is normal, not an error.** It was initially misdiagnosed as a stale-cache bug (ADR 0009), then corrected (ADR 0010): the message just means every `.sol` file already has a valid cached build. This lives in `docs/memory/contracts/hardhat-3-esm-migration.md` and two ADRs, but not in `README.md`, which is the first place a contributor hitting this message would look.
2. **`frontend/package.json` lists `ethers` as a dependency, but it's dead weight.** Investigating the security audit found `ethers` is never imported anywhere in `frontend/src/` — only `web3` is actually used for contract calls (in `pinata_ipfs_nft_service.js`). The user declined to act on this (or the broader `npm audit` findings) for now, but the fact itself — don't assume `ethers` is live code, don't be surprised it's unused — is worth recording so it isn't rediscovered by confusion later, and so a future dependency cleanup has a documented starting point.

Both are currently only in `docs/decisions/`, `docs/adr/`, and `docs/memory/` — accurate, but not where a contributor skimming `README.md` for a specific error message or wondering "what does the frontend actually use for contract calls" would find them.

## Decision

Add both learnings to `README.md`:

- **Contracts-facing:** extend the "Troubleshooting" section with a `No contracts to compile` entry explaining it's the normal "already up to date" message, not an error, with the `npx hardhat clean` pointer for when a forced rebuild is actually wanted.
- **Frontend-facing:** add a short note to the "Frontend" section's stack description clarifying that despite `ethers` appearing in `frontend/package.json`, all contract reads/writes go through `web3` (`pinata_ipfs_nft_service.js`) — `ethers` is currently unused.

No dependency changes, no `npm audit` remediation — the user explicitly deferred that ("no not now"). This ADR is documentation-only.

## Options Considered

### Option A — Add both notes to README *(chosen)*
- **Pros:** puts the two concrete "gotchas" from this session where a contributor will actually see them, without requiring any dependency changes the user hasn't approved.
- **Cons:** one more thing to keep in sync if `ethers` is later removed or actually adopted.

### Option B — Leave it in `docs/adr/`/`docs/memory/` only
- **Pros:** zero effort; already technically documented.
- **Cons:** doesn't solve the actual problem — a contributor reading `README.md` (the natural first stop) won't find either piece of context there.

## Consequences

- **Positive:** both learnings are now discoverable from the README itself, not just the ADR/memory trail.
- **Negative:** none of substance — pure documentation addition.
- **Frontend impact:** none to code; README only. If `ethers` is later removed (a separate, deferred decision), this note should be removed too.
- **Contracts impact:** none to code; README only.
- **Follow-ups:** if the user later revisits the `npm audit`/unused-`ethers` cleanup, update or remove this README note accordingly.

## References

- ADR 0009 / ADR 0010 — the "No contracts to compile" misdiagnosis and correction.
- `docs/memory/contracts/hardhat-3-esm-migration.md` — where the compile-cache gotcha already lives.
- This conversation's security audit (dependency vulnerabilities + secret-exposure check) — where the unused-`ethers` finding came from.
