---
date: 2026-07-28
scope: both
status: accepted
related_adr: 0024-readme-crt-metamask-import
supersedes: none
---

# Document CRT MetaMask manual-import requirement, and fix stale Sepolia reference addresses in the same section

## Context

User's real Sepolia mint succeeded and the CRT reward was confirmed on-chain (verified via the transaction receipt: 10 CRT `Transfer`red from the registry to the recipient wallet), but it wasn't visible in MetaMask because MetaMask doesn't auto-detect arbitrary ERC-20 token balances — the same class of limitation the README already documents for NFTs (ADR 0016). While preparing the fix, the README's hardcoded "Reference deployment (Sepolia)" addresses were found to be stale (from an earlier deploy, not today's).

## Decision

Write ADR 0024 and a draft plan trio (0024) to add a CRT-specific MetaMask "Import tokens" note (parallel to the existing NFT note), a matching Troubleshooting bullet, and refresh the two stale Sepolia addresses in the same README section, since shipping a "here's the CRT address" note next to a stale address would be self-defeating. Plans start in `docs/plans/draft/` and stay there pending the user's `implement`/`autonomous` command — no README edits made yet in this decision.

## Alternatives Considered

- **Add the note without touching the stale addresses** — rejected; would leave a contradiction in the same section.
- **Also fix the unrelated stale `"Car Owner Wallet (recipient)"` label reference at `README.md:268`** — rejected for this plan; different topic (ADR 0023's label change), flagged separately in ADR 0024's Consequences rather than folded in, to keep this change's diff focused on the CRT-visibility topic the user actually asked about.

## Consequences

- **Positive:** Once implemented, README will correctly explain why CRT doesn't appear automatically and how to add it, with an address readers can trust.
- **Negative / accepted costs:** None material.
- **Follow-ups required:** Awaiting user's `implement` or `autonomous` command to execute plan 0024's tasks. The stale `README.md:268` label is a known, separately-flagged follow-up, not scheduled here.
