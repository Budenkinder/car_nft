---
date: 2026-07-28
scope: contracts
status: accepted
related_adr: 0020-automated-hardhat-test-suite
supersedes: none
---

# Use Hardhat's native Mocha/ethers runner for automated contract tests; do not combine with plan 0019

## Context

User asked for automated tests of `VinCidRegistry` and `CarRewardToken`, Hardhat-only, no MetaMask, with documented output — and asked whether this could be combined with plan 0019 (persistent local `hardhat node` across terminal restarts), cancelling 0019 if so.

## Decision

Not combined. `npx hardhat test` deploys against Hardhat's own ephemeral in-process network via `network.create()` — a separate mechanism entirely from the standalone `hardhat node` JSON-RPC server that plan 0019 makes persistent. Automated tests want fresh, isolated state every run (achieved here via `networkHelpers.loadFixture`); a shared long-lived devnet is the opposite of what a repeatable test suite wants (VIN-already-registered-style flakiness if state carried over between runs). Plan 0019 stays as-is, targeting manual/interactive testing (frontend + MetaMask, or a console session) across terminal restarts — a genuinely different use case. Chose Hardhat's native Mocha/ethers/chai-matchers runner (already fully installed, zero new deps, matches Hardhat 3's own bundled template) over Foundry or Hardhat 3's newer Solidity-native test runner.

## Alternatives Considered

- **Combine with plan 0019, run tests against the persistent node** — rejected: wrong tool for the job, would make tests order-dependent and flaky, and conflates "manual devnet persistence" with "automated repeatable testing."
- **Foundry `forge test`** — rejected: new toolchain, container rebuild, contradicts "Hardhat only."
- **Hardhat 3 Solidity-native test runner (`test solidity`)** — rejected for now: less mature path in this toolchain, no precedent in this JS/ESM repo, no validated path to the gas-stats/Markdown report requirement.
- **Hardhat's native Mocha/ethers runner (chosen)** — zero new dependencies, proven against this repo's exact installed versions via a scratch probe before committing to the plan.

## Consequences

- **Positive:** Plan 0019 is untouched and still valid for its actual purpose; the new test plan (0020) is scoped correctly around Hardhat's ephemeral network instead of awkwardly depending on a long-running background node.
- **Negative / accepted costs:** Two separate pieces of "local Hardhat tooling" now exist in the repo (persistent dev node vs. ephemeral test runner) — slightly more surface to explain to a new contributor, mitigated by each having its own ADR/memory.
- **Follow-ups required:** Plan 0020 (contracts + frontend trio) written; a further ADR (0021) covers wiring `npm test` into a CI pipeline gating Vercel deploys.
