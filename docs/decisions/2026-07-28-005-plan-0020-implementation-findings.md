---
date: 2026-07-28
scope: contracts
status: accepted
related_adr: 0020-automated-hardhat-test-suite
supersedes: none
---

# Plan 0020 implementation: two findings beyond the original task list

## Context

While implementing plan 0020's tests (task 6), two issues surfaced that the plan didn't anticipate: (1) a deprecated chai matcher (`.to.be.reverted`) whose failure was observed corrupting a *later* test's `loadFixture` state in the same file, and (2) a real gas-estimation gotcha where `storeCid`'s CRT reward can silently not pay out under default gas estimation even with a fully funded, correctly configured registry, because the `try/catch` around `_payReward` hides the inner call's out-of-gas from `eth_estimateGas`'s search.

## Decision

Fixed (1) directly — switched to `.to.not.revert(ethers)`, the non-deprecated API; this is a pure test-correctness fix, in scope for "write correct tests." Documented but did not fix (2) — added a dedicated test proving the failure mode, an Open Question in plan 0020's contracts file, and a new memory file (`docs/memory/contracts/reward-payout-gas-estimation-risk.md`) since it's a real production risk (the frontend's MetaMask-driven mint flow could hit the same gap) that's outside this plan's scope to fix unilaterally.

## Alternatives Considered

- **Silently work around (2) in tests only, without flagging it** — rejected: this is a genuine correctness risk for real users, not just a test-writing inconvenience; burying it would contradict the plan's own "documented output" goal.
- **Fix (2) now (e.g. have the frontend pass an explicit gas limit)** — rejected for this plan: out of scope (this is the contracts *testing* plan, not a frontend change plan), and the right fix (frontend gas buffer vs. contract restructuring) is a real design decision that belongs in its own ADR, not a side effect of writing tests.

## Consequences

- **Positive:** Both findings are now discoverable via memory and the plan's Open Questions rather than only living in this session's transcript.
- **Negative / accepted costs:** The reward-payout gas-estimation risk remains unfixed in production until the user decides how to address it.
- **Follow-ups required:** User decision on whether/how to address the gas-estimation risk (frontend gas buffer, contract change, or accept as-is) and the pre-existing reentrancy divergence (ADR 0020's original Open Question) — both deferred, not blocking plan 0020's completion.
