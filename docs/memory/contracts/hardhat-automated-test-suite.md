---
name: hardhat-automated-test-suite
description: Automated Hardhat tests use network.create() + loadFixture (not the persistent hardhat node); npm test / npm run test:report; report at docs/testing/automated-test-report.md.
metadata:
  type: project
  scope: contracts
---

Automated tests for `VinCidRegistry`/`CarRewardToken` live under `test/`, using Hardhat 3's native Mocha + ethers runner (bundled in `@nomicfoundation/hardhat-toolbox-mocha-ethers` — no extra deps). Each file opens with `const { ethers, networkHelpers } = await network.create();` (top-level await, ESM). `test/fixtures.js` exports `deployRegistryFixture(ethers)` (takes `ethers` as a param, since it must run on the *same* network connection as the calling test file); each test file wraps it in a local zero-arg `fixture()` and calls `networkHelpers.loadFixture(fixture)` for fast, isolated per-test state (confirmed via a probe: state genuinely reverts between tests, even across different `it()`/`describe()` blocks reusing the same fixture function reference).

Chai matcher note: this Hardhat 3 toolchain deprecated the bare `.to.be.reverted` — use `.to.revert(ethers)` / `.to.not.revert(ethers)` instead (`revertedWith`/`revertedWithCustomError`/`emit` are unaffected). Using the deprecated matcher doesn't just fail that one assertion — the thrown deprecation error was observed corrupting a *later* test's `loadFixture` state in the same file (state leaked across tests until the deprecated matcher was replaced), so treat any deprecation warning here as a same-file blast radius, not an isolated failure.

`npm test` runs the suite with the default spec reporter (human-readable). `npm run test:report` re-runs it with `--gas-stats-json` and renders a committed Markdown report at `docs/testing/automated-test-report.md` (the raw log and gas JSON are gitignored intermediates — only the rendered `.md` is committed).

Two test-only mock contracts live under `contracts/mocks/`: `NonStandardERC20Mock` (exercises `withdrawToken`'s no-bool-return branch) and `MaliciousReentrantReceiver` (documents — does not fix — a reentrancy-during-mint divergence between `vinToCid` and the NFT's actual `tokenURI`, see ADR 0020's Open Questions). Neither is ever deployed by `scripts/deploy.js`.

**Why:** [[persistent-local-hardhat-node]] (ADR 0019) persists the standalone `hardhat node` process for *manual* testing across terminal restarts. Automated tests are a different, unrelated mechanism — `network.create()` spins up its own ephemeral in-memory chain per test run, which is what you want for repeatable, isolated tests. The two were deliberately kept separate; see `docs/decisions/2026-07-28-002-automated-hardhat-test-suite.md`.

**How to apply:** When adding contract tests, use `loadFixture` rather than manual `beforeEach` redeploys for speed; don't route automated tests through `npm run node:bg` / the persistent devnet — that's for manual/frontend testing only.
