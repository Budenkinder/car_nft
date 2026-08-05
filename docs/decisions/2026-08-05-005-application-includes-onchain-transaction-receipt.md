---
date: 2026-08-05
scope: both
status: accepted
related_adr: 0037-application-onchain-receipt
supersedes: none
---

# Organization applications include a real, mined on-chain transaction receipt — not just a better-presented signature

## Context

User request: "When the user applies for a registration and signs in, then the transaction link and id should be put into the mail. To ensure, that the transaction was successful." The existing "sign in" step is a `personal_sign` challenge — off-chain, no gas, no transaction hash exists for it. The request was ambiguous about what "transaction" meant, and the three plausible readings have very different costs: (1) present the existing off-chain signature better (free, but not a "transaction"), (2) link to the applicant's wallet address on a block explorer for context (free, but proves nothing about success), (3) have the applicant submit a real on-chain transaction (costs gas, but is a genuine, verifiable transaction with a real hash).

Asked the user directly via `AskUserQuestion`. Answer: option 3 — a real on-chain transaction.

## Decision

Add a new, minimal, stateless `submitApplication()` function to `VinCidRegistry` (ADR `0037`) that any wallet may call, emitting only `ApplicationSubmitted(address indexed applicant, uint256 timestamp)` — no application content, no hash of anything, so decision `2026-08-03-002` ("nothing but wallet address and role goes on-chain") is not touched. The frontend calls this after the existing signature step, waits for the mined receipt, and only includes the transaction hash and a block-explorer link in the application email once the receipt confirms success. A reverted or failed transaction blocks progress instead of being silently included — directly satisfying "to ensure that the transaction was successful."

This is treated as a new ADR/plan trio (`0037`) rather than a further amendment to the already-in-progress plan `0035`, because it reopens ground that plan 0035's decisions (`2026-08-03-001`, `-002`) deliberately closed (an all-off-chain, gas-free intake flow) and introduces a new hard requirement (the applicant must hold gas) that changes the shape of the flow, not just its field list — unlike the three prior `OrgRegistrationForm` field-trimming/code-review requests this session, which were pure amendments within 0035's existing design.

## Alternatives Considered

- **Real on-chain transaction** *(chosen — user's explicit answer)* — see ADR 0037 for the full options analysis (hash-commitment and separate-contract alternatives were considered and rejected there).
- **Better-presented signature only** — zero cost, fully consistent with the existing design, but does not satisfy the user's explicit choice.
- **Block-explorer link to the wallet address** — no proof of success for anything happening in this flow; rejected as not answering the actual request.

## Consequences

- **Positive:** Resolved a genuinely ambiguous request before writing any code, avoiding a wasted implementation of the wrong interpretation (e.g., a cosmetic signature-verification note nobody asked for).
- **Negative / accepted costs:** None from asking; the chosen path's costs are recorded in ADR 0037.
- **Follow-ups required:** Implement per `docs/plans/draft/0037-application-onchain-receipt-contracts.md` and `-frontend.md`, pending user approval (CLAUDE.md §5 — no implementation before an explicit `autonomous`/`implement`).
