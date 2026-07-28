# ADR 0020: Automated Hardhat test suite for VinCidRegistry and CarRewardToken

- **Status:** accepted
- **Date:** 2026-07-28
- **Scope:** contracts
- **Related plans:**
  - `docs/plans/draft/0020-automated-hardhat-test-suite-frontend.md`
  - `docs/plans/draft/0020-automated-hardhat-test-suite-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-28-002-automated-hardhat-test-suite.md`

## Context

There is no automated test suite for either contract today: no `test/` directory, no `test` script in `package.json`, and per existing project memory, "no automated test suite currently covers this file; manual verification remains the standard" (established for the frontend's IPFS/mint flow, and equally true for the contracts). The only recorded testing is manual and MetaMask-driven (`docs/testing/sepolia-nft-mint-test-case.pdf`).

The user wants automated tests for both `VinCidRegistry` and `CarRewardToken` that don't require MetaMask or a browser, using Hardhat only, with the results documented as an artifact (not just console output that scrolls away).

Also evaluated: whether this should be combined with plan 0019 (keeping the local `hardhat node` alive across terminal restarts). It should not — see the decision log entry for the reasoning; in short, `npx hardhat test` uses Hardhat's own ephemeral in-process network (`network.create()`), never the standalone `hardhat node` JSON-RPC server that 0019 persists. Isolated, auto-reset state per test run is exactly what automated tests want; a shared long-lived devnet is what 0019 is *for*, aimed at manual/interactive testing.

## Decision

Use Hardhat 3's built-in Mocha + ethers test runner, already fully installed via `@nomicfoundation/hardhat-toolbox-mocha-ethers` (ethers, chai matchers, and `@nomicfoundation/hardhat-network-helpers`'s `loadFixture` are all bundled — confirmed by inspecting `node_modules` and by running a scratch probe test against this exact toolchain). Tests live under `test/`, deploy contracts via `network.create()`'s ephemeral network, and use `networkHelpers.loadFixture` for fast, isolated state per test.

Coverage spans both contracts' full public surface, including validation reverts, access control, the reward-payout path (and its silent-failure edge case), and two narrowly-scoped edge-case suites backed by small mock contracts under `contracts/mocks/`: a non-standard ERC-20 (to exercise `withdrawToken`'s no-bool-return branch) and a malicious `onERC721Received` receiver (to document — not fix — an observed reentrancy-during-mint state divergence between `vinToCid` and the NFT's actual `tokenURI`).

Output is documented via `npm run test:report`, which runs the suite with `--gas-stats-json`, captures the run, and renders a committed Markdown report at `docs/testing/automated-test-report.md`.

## Options Considered

### Option A — Hardhat's native Mocha/ethers/chai-matchers runner (chosen)
- **Pros:** Zero new dependencies — everything needed is already installed via the toolbox. Matches Hardhat 3's own bundled template pattern (`node_modules/hardhat/templates/hardhat-3/02-mocha-ethers`) exactly, so it's the well-trodden path for this exact toolchain. No MetaMask, no browser — pure Node process. Fast (in-memory EDR chain, `loadFixture` snapshots).
- **Cons:** Mocha/Chai has a learning curve if unfamiliar; JS-only assertions (see Option C for a Solidity-native alternative).

### Option B — Foundry (`forge test`)
- **Pros:** Very fast, Solidity-native, industry-popular, built-in gas snapshots.
- **Cons:** Requires installing Foundry — a new toolchain and container rebuild, the same objection already raised and deferred in ADR 0019 for Anvil. Directly contradicts the user's explicit "Hardhat only" requirement. Rejected.

### Option C — Hardhat 3's experimental Solidity test runner (`hardhat test solidity`, `.t.sol` files)
- **Pros:** Still "Hardhat," no Mocha/JS needed, Solidity-native assertions/cheatcodes (seen in the bundled `01-node-test-runner-viem` template).
- **Cons:** Newer, less mature path within Hardhat 3; no precedent anywhere in this JS/ESM repo; doesn't obviously plug into the gas-stats-json + Markdown reporting pipeline validated for the Mocha runner. Rejected in favor of the more proven Option A, but worth reconsidering later if the project moves toward Solidity-native testing generally.

### Option D — Browser/MetaMask end-to-end automation (e.g. Playwright + a MetaMask driver)
- **Pros:** Would exercise the real wallet-signing UX.
- **Cons:** Explicitly excluded by the user ("without using MetaMask"). Rejected outright.

## Consequences

- **Positive:** Both contracts get real regression coverage for the first time; failures are caught before manual/Sepolia testing; the reward-payout and non-standard-token branches (previously untested defensive code) get explicit coverage; the reentrancy finding is documented as a reproducible test rather than living only in this ADR's prose.
- **Negative:** Two test-only mock contracts added under `contracts/mocks/` (never deployed by `scripts/deploy.js`, which names its two contracts explicitly — no accidental production deployment risk, but they are new Solidity surface to maintain). The reentrancy edge case is documented, not fixed — a real (if low-severity) state-divergence behavior ships as "known and tested," not "resolved."
- **Frontend impact:** None. No ABI, address, or event changes — this ADR is contracts-only.
- **Contracts impact:** New `test/` directory, new `contracts/mocks/` directory, new `test`/`test:report` npm scripts, new `scripts/generate-test-report.js`, new committed `docs/testing/automated-test-report.md`.
- **Follow-ups:** ADR 0021 (Vercel pipeline) depends on `npm test` existing from this ADR. Whether to actually *fix* the documented reentrancy divergence is deferred to the user — flagged as an Open Question in the contracts plan, not decided here.

## References

- `node_modules/hardhat/templates/hardhat-3/02-mocha-ethers/test/Counter.ts` — the exact toolchain pattern this ADR follows (`network.create()`, top-level `ethers`, chai matchers).
- `node_modules/@nomicfoundation/hardhat-network-helpers/dist/src/types.d.ts` — confirms `const { networkHelpers } = await network.create(); networkHelpers.loadFixture(...)`.
- Scratch probe run against this repo's installed `hardhat@3.10.0` confirmed both the ESM test pattern and the exact `--gas-stats-json` output shape (`{ contracts: { "<source>:<name>": { deployment: {...}, functions: {...} } } }`).
- `contracts/car_nft_sc.sol:49-81` (`storeCid`) and `contracts/car_reward_token.sol` — the functions under test.
