# Plan 0020 — Automated Hardhat test suite for VinCidRegistry and CarRewardToken — Contracts

- **ADR:** `docs/adr/0020-automated-hardhat-test-suite.md`
- **Paired plan:** `docs/plans/draft/0020-automated-hardhat-test-suite-frontend.md`
- **Status:** draft
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add an automated Hardhat test suite (Mocha + ethers + chai matchers, all already installed via `@nomicfoundation/hardhat-toolbox-mocha-ethers` — no new dependencies) covering `VinCidRegistry` and `CarRewardToken`'s full public surface, and a `npm run test:report` command that renders the run into a committed, human-readable Markdown report under `docs/testing/`.

**Out of scope:** any change to `contracts/car_nft_sc.sol` or `contracts/car_reward_token.sol` themselves — including the reentrancy state-divergence behavior this plan documents via a test (see Open Questions for whether to fix it separately). No browser/MetaMask automation. Not combined with plan 0019 (persistent local node) — see ADR 0020's Context for why they're orthogonal.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `test/fixtures.js` | add | `deployRegistryFixture()` — deploys `CarRewardToken` + `VinCidRegistry`, funds the registry with CRT, sets a reward amount; returns contracts + labeled signers. Used via `networkHelpers.loadFixture` across test files. |
| `contracts/mocks/NonStandardERC20Mock.sol` | add | Minimal ERC-20-like contract whose `transfer` returns no boolean — exercises `withdrawToken`'s non-compliant-token branch. Test-only; never referenced by `scripts/deploy.js`. |
| `contracts/mocks/MaliciousReentrantReceiver.sol` | add | Implements `onERC721Received` and calls back into `storeCid` — exercises the reentrancy-during-mint edge case. Test-only. |
| `test/CarRewardToken.test.js` | add | Constructor (name/symbol/decimals/initial supply/owner); `mint` (onlyOwner + success). |
| `test/VinCidRegistry.test.js` | add | Constructor; `storeCid` new-mint and update paths (happy paths + all `require` branches); admin functions; reward payout incl. zero-balance edge case; view functions. |
| `test/VinCidRegistry.edgeCases.test.js` | add | Non-standard-token `withdrawToken` branch (via `NonStandardERC20Mock`); reentrant-mint documentation test (via `MaliciousReentrantReceiver`). |
| `hardhat.config.js` | modify | Add `test.mocha.reporter: process.env.MOCHA_REPORTER \|\| "spec"` so `npm test` stays human-readable while `test:report` can switch reporters. |
| `scripts/generate-test-report.js` | add | Runs `hardhat test --gas-stats-json docs/testing/gas-report.json`, tees output to `docs/testing/test-output.log` (still visible live), parses both into `docs/testing/automated-test-report.md`. Propagates the test run's exit code. |
| `package.json` | modify | Add `"test": "hardhat test"` and `"test:report": "node scripts/generate-test-report.js"`. |
| `.gitignore` | modify | Ignore `docs/testing/test-output.log` and `docs/testing/gas-report.json` (regenerated intermediates); the rendered `.md` report is committed. |
| `docs/testing/automated-test-report.md` | add (generated) | Committed output of the first `npm run test:report` run — the "documented output" deliverable. |
| `README.md` | modify | New "Running the contract test suite" section. |
| `docs/memory/contracts/hardhat-automated-test-suite.md` | add | Memory: `loadFixture` pattern, mocks' narrow purpose, report-generation mechanism. |
| `docs/memory/MEMORY.md` | modify | Index line. |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [ ] **1.** Add `"test": "hardhat test"` to `package.json` scripts.
- [ ] **2.** Create `test/fixtures.js`: `deployRegistryFixture()` deploys `CarRewardToken`, deploys `VinCidRegistry(rewardTokenAddress, minterSigner.address)`, transfers a CRT pool to the registry and calls `setRewardAmount`, and returns `{ token, registry, owner, minter, recipient, other }` (named signers from `ethers.getSigners()`). Exported for reuse via `networkHelpers.loadFixture` in every test file below.
- [ ] **3.** Create `contracts/mocks/NonStandardERC20Mock.sol`: a tiny ERC-20-shaped contract (name/symbol optional) whose `transfer(address,uint256)` moves balances but returns nothing (`function transfer(...) external { ... }` with no `bool` return / no `returns` clause), so `withdrawToken`'s `data.length == 0` branch is reachable.
- [ ] **4.** Create `contracts/mocks/MaliciousReentrantReceiver.sol`: implements `IERC721Receiver.onERC721Received`, and on receipt calls `VinCidRegistry.storeCid` again (configurable VIN/CID via constructor or a setter) to reproduce the reentrant-mint scenario.
- [ ] **5.** Create `test/CarRewardToken.test.js` using `loadFixture`: constructor sets `name() == "CarRewardToken"`, `symbol() == "CRT"`, `decimals() == 18`, `totalSupply()`/`balanceOf(owner)` both equal `1_000_000_000n * 10n ** 18n`, `owner() == deployer`. `mint`: reverts with `OwnableUnauthorizedAccount` for a non-owner caller; succeeds and increases `balanceOf`/`totalSupply` for the owner.
- [ ] **6.** Create `test/VinCidRegistry.test.js` using `loadFixture`, covering:
  - Constructor: deploying with `initialMinter = address(0)` reverts `"Minter required"`; a fresh deploy's `minter()` matches the constructor arg and emits `MinterChanged(address(0), initialMinter)`.
  - `storeCid` new-mint happy path: minter calls with a 17-char VIN and non-empty CID → `ownerOf(tokenId) == recipient`, `tokenURI(tokenId) == "ipfs://<cid>"`, emits `CidStored(vin, cid, tokenId)`, `getAllVins()` includes the VIN, `getCidByVin(vin) == cid`, recipient's CRT balance increases by the configured reward amount.
  - `storeCid` new-mint validation reverts: VIN length ≠ 17 → `"VIN must be 17 characters"`; empty CID → `"CID required"`; non-minter caller on a new VIN → `"Only minter can mint"`; zero-address recipient on a new VIN → `"Recipient required"`.
  - `storeCid` update path: after an initial mint, any signer (not just minter) calling again with the same VIN and a new CID succeeds — `tokenURI` reflects the new CID, `CidStored` re-emitted with the same `tokenId`, no second NFT minted (`totalSupply`/`ownerOf` unchanged), no second reward paid (CRT balance unchanged from the update call).
  - Admin functions: `setMinter` — reverts `OwnableUnauthorizedAccount` for non-owner, reverts `"Minter required"` for zero address, emits `MinterChanged`, updates `minter()`. `setRewardToken` / `setRewardAmount` — onlyOwner enforcement + state updates. `withdrawToken` (using `CarRewardToken`, the standard-compliant token) — reverts for non-owner, reverts `"Invalid recipient"` for zero `to`, happy path moves the registry's balance and emits `TokensWithdrawn`.
  - Reward-payout edge case: a registry with zero CRT balance (or `rewardAmount == 0`) still completes `storeCid` successfully (mint/URI/event all still happen) — proves the `try/catch` around `_payReward` swallows the transfer failure without reverting the mint.
  - View functions: `getAllVins()`/`getAllCidsAsList()` stay parallel and correctly ordered across multiple mints; both return empty arrays on a fresh registry.
- [ ] **7.** Create `test/VinCidRegistry.edgeCases.test.js`:
  - Non-standard token: deploy `NonStandardERC20Mock`, fund the registry with it, call `withdrawToken` for it as owner, and confirm the transfer succeeds despite no boolean return (exercises the `data.length == 0` branch).
  - Reentrancy: deploy `MaliciousReentrantReceiver` as the mint `recipient`, call `storeCid` from the minter, and assert the actual observed outcome — the outer call's `tokenURI` write executes *after* the reentrant inner call's, so the final `tokenURI` reflects the outer (original) CID while `getCidByVin` (the `vinToCid` mapping) reflects the inner (reentrant) CID. Document this divergence explicitly in the test's assertions and a comment — this test exists to pin down and describe current behavior, not to assert it's correct.
- [ ] **8.** Add `test.mocha.reporter: process.env.MOCHA_REPORTER || "spec"` to `hardhat.config.js`'s exported config.
- [ ] **9.** Create `scripts/generate-test-report.js` (ESM): spawn `npx hardhat test --gas-stats-json docs/testing/gas-report.json`, piping child stdout/stderr both to the parent process (live feedback) and into `docs/testing/test-output.log`. After the child exits, parse `test-output.log` for Mocha's final summary line (`N passing`/`M failing`) and any failure blocks, parse `gas-report.json` for the shape `{ contracts: { "<source>:<name>": { deployment: {min,max,avg,median,count,runtimeSize}, functions: { "<fn>": {min,max,avg,median,count} } } } }`, and render `docs/testing/automated-test-report.md`: a title, run date, pass/fail summary, a gas-usage table per contract (deployment cost + per-function min/avg/max), and — on failure — the failure details inline. Exit with the child's exit code (so `npm run test:report` fails visibly, e.g. in CI).
- [ ] **10.** Add `"test:report": "node scripts/generate-test-report.js"` to `package.json` scripts.
- [ ] **11.** Add `docs/testing/test-output.log` and `docs/testing/gas-report.json` to `.gitignore` (regenerated intermediates); run `npm run test:report` once and commit the resulting `docs/testing/automated-test-report.md`.
- [ ] **12.** Update `README.md` with a "Running the contract test suite" section: `npm test` for local dev feedback (spec reporter), `npm run test:report` to regenerate the committed report, and a link to `docs/testing/automated-test-report.md`.
- [ ] **13.** Create `docs/memory/contracts/hardhat-automated-test-suite.md` and add its index line to `docs/memory/MEMORY.md`.

## Contract Surface

- No changes to `VinCidRegistry` or `CarRewardToken`.
- Two new test-only contracts under `contracts/mocks/` (`NonStandardERC20Mock`, `MaliciousReentrantReceiver`) — not referenced by `scripts/deploy.js`, which deploys `CarRewardToken` and `VinCidRegistry` by explicit factory name, so there is no path by which these mocks get deployed to Sepolia or any production network.

## Interfaces with Frontend

- None. No ABI, address, or event changes — see the paired frontend plan (no-op).

## Testing

- **Meta-verification (this plan's own correctness):** for at least the VIN-length, non-minter, and reward-edge-case tests, temporarily invert the contract's `require`/behavior locally, confirm the corresponding test fails, then revert — proves the tests aren't vacuously passing.
- `npm test` runs clean (all green) against the contracts as they exist today.
- `npm run test:report` produces `docs/testing/automated-test-report.md` with an accurate pass count and a non-empty gas table for both contracts; re-running it is idempotent (overwrites cleanly, no stale data).
- Confirm the report generator correctly propagates a non-zero exit code when a test is deliberately broken (needed for ADR 0021's CI gate to work).

## Deployment and Migration

- Not applicable — test-only and tooling changes, no on-chain migration, no `scripts/deploy.js` changes.

## Risks and Rollback

- **Risk:** the reentrancy edge-case test documents a real (low-severity) state-divergence behavior rather than fixing it — see Open Questions.
- **Risk:** `contracts/mocks/*.sol` are compiled alongside production contracts (Hardhat compiles everything under `contracts/`) — negligible size/gas impact since they're never deployed, but worth knowing they exist if `npm run compile`'s artifact count grows.
- **Rollback:** delete `test/`, `contracts/mocks/`, `scripts/generate-test-report.js`, revert `package.json`/`hardhat.config.js`/`.gitignore`/`README.md` diffs, remove `docs/testing/automated-test-report.md`. No on-chain or deployed-contract effect either way.

## Open Questions

- The reentrancy finding in task 7 (`vinToCid` vs. `tokenURI` divergence when `recipient` is a malicious contract during the *first* mint of a VIN) is real but low-severity — `recipient` in this system's intended usage is the car owner's own wallet, not an attacker's, so the practical blast radius is "you can confuse your own record," not fund loss. Should a follow-up ADR propose actually fixing it (e.g. moving `_setTokenURI` before `_safeMint`, or a reentrancy guard), or is documenting it via this test sufficient for now? Left for the user to decide — not addressed by this plan.
