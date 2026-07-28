---
name: hardhat-automated-test-suite
description: Automated Hardhat tests use network.create() + loadFixture (not the persistent hardhat node); npm test / npm run test:report; report at docs/testing/automated-test-report.md.
metadata:
  type: project
  scope: contracts
---

Automated tests for `VinCidRegistry`/`CarRewardToken` live under `test/`, using Hardhat 3's native Mocha + ethers runner (bundled in `@nomicfoundation/hardhat-toolbox-mocha-ethers` — no extra deps). Each file opens with `const { ethers, networkHelpers } = await network.create();` (top-level await, ESM) and uses `networkHelpers.loadFixture(deployRegistryFixture)` from `test/fixtures.js` for fast, isolated per-test state.

`npm test` runs the suite with the default spec reporter (human-readable). `npm run test:report` re-runs it with `--gas-stats-json` and renders a committed Markdown report at `docs/testing/automated-test-report.md` (the raw log and gas JSON are gitignored intermediates — only the rendered `.md` is committed).

Two test-only mock contracts live under `contracts/mocks/`: `NonStandardERC20Mock` (exercises `withdrawToken`'s no-bool-return branch) and `MaliciousReentrantReceiver` (documents — does not fix — a reentrancy-during-mint divergence between `vinToCid` and the NFT's actual `tokenURI`, see ADR 0020's Open Questions). Neither is ever deployed by `scripts/deploy.js`.

**Why:** [[persistent-local-hardhat-node]] (ADR 0019) persists the standalone `hardhat node` process for *manual* testing across terminal restarts. Automated tests are a different, unrelated mechanism — `network.create()` spins up its own ephemeral in-memory chain per test run, which is what you want for repeatable, isolated tests. The two were deliberately kept separate; see `docs/decisions/2026-07-28-002-automated-hardhat-test-suite.md`.

**How to apply:** When adding contract tests, use `loadFixture` rather than manual `beforeEach` redeploys for speed; don't route automated tests through `npm run node:bg` / the persistent devnet — that's for manual/frontend testing only.
