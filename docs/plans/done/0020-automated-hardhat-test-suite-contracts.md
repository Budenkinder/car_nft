# Plan 0020 — Automated Hardhat test suite for VinCidRegistry and CarRewardToken — Contracts

- **ADR:** `docs/adr/0020-automated-hardhat-test-suite.md`
- **Paired plan:** `docs/plans/done/0020-automated-hardhat-test-suite-frontend.md`
- **Status:** done
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

- [x] **1.** Add `"test": "hardhat test"` to `package.json` scripts.
- [x] **2.** Create `test/fixtures.js`: `deployRegistryFixture()` deploys `CarRewardToken`, deploys `VinCidRegistry(rewardTokenAddress, minterSigner.address)`, transfers a CRT pool to the registry and calls `setRewardAmount`, and returns `{ token, registry, owner, minter, recipient, other }` (named signers from `ethers.getSigners()`). Exported for reuse via `networkHelpers.loadFixture` in every test file below.
- [x] **3.** Create `contracts/mocks/NonStandardERC20Mock.sol`: a tiny ERC-20-shaped contract (name/symbol optional) whose `transfer(address,uint256)` moves balances but returns nothing (`function transfer(...) external { ... }` with no `bool` return / no `returns` clause), so `withdrawToken`'s `data.length == 0` branch is reachable.
- [x] **4.** Create `contracts/mocks/MaliciousReentrantReceiver.sol`: implements `IERC721Receiver.onERC721Received`, and on receipt calls `VinCidRegistry.storeCid` again (configurable VIN/CID via constructor or a setter) to reproduce the reentrant-mint scenario.
- [x] **5.** Create `test/CarRewardToken.test.js` using `loadFixture`: constructor sets `name() == "CarRewardToken"`, `symbol() == "CRT"`, `decimals() == 18`, `totalSupply()`/`balanceOf(owner)` both equal `1_000_000_000n * 10n ** 18n`, `owner() == deployer`. `mint`: reverts with `OwnableUnauthorizedAccount` for a non-owner caller; succeeds and increases `balanceOf`/`totalSupply` for the owner.
- [x] **6.** Create `test/VinCidRegistry.test.js` using `loadFixture`, covering:
  - Constructor: deploying with `initialMinter = address(0)` reverts `"Minter required"`; a fresh deploy's `minter()` matches the constructor arg and emits `MinterChanged(address(0), initialMinter)`.
  - `storeCid` new-mint happy path: minter calls with a 17-char VIN and non-empty CID → `ownerOf(tokenId) == recipient`, `tokenURI(tokenId) == "ipfs://<cid>"`, emits `CidStored(vin, cid, tokenId)`, `getAllVins()` includes the VIN, `getCidByVin(vin) == cid`, recipient's CRT balance increases by the configured reward amount.
  - `storeCid` new-mint validation reverts: VIN length ≠ 17 → `"VIN must be 17 characters"`; empty CID → `"CID required"`; non-minter caller on a new VIN → `"Only minter can mint"`; zero-address recipient on a new VIN → `"Recipient required"`.
  - `storeCid` update path: after an initial mint, any signer (not just minter) calling again with the same VIN and a new CID succeeds — `tokenURI` reflects the new CID, `CidStored` re-emitted with the same `tokenId`, no second NFT minted (`totalSupply`/`ownerOf` unchanged), no second reward paid (CRT balance unchanged from the update call).
  - Admin functions: `setMinter` — reverts `OwnableUnauthorizedAccount` for non-owner, reverts `"Minter required"` for zero address, emits `MinterChanged`, updates `minter()`. `setRewardToken` / `setRewardAmount` — onlyOwner enforcement + state updates. `withdrawToken` (using `CarRewardToken`, the standard-compliant token) — reverts for non-owner, reverts `"Invalid recipient"` for zero `to`, happy path moves the registry's balance and emits `TokensWithdrawn`.
  - Reward-payout edge case: a registry with zero CRT balance (or `rewardAmount == 0`) still completes `storeCid` successfully (mint/URI/event all still happen) — proves the `try/catch` around `_payReward` swallows the transfer failure without reverting the mint.
  - View functions: `getAllVins()`/`getAllCidsAsList()` stay parallel and correctly ordered across multiple mints; both return empty arrays on a fresh registry.
  - **Deviation found during implementation:** happy-path reward tests needed an explicit `gasLimit` override (`storeCid(..., { gasLimit: 500_000n })`) to make the reward payout land deterministically — see the new dedicated test and Open Questions below for why. Also, this Hardhat 3 toolchain deprecated the bare `.to.be.reverted` chai matcher (must use `.to.revert(ethers)`); using the deprecated form was observed to corrupt a *later* test's `loadFixture` state in the same file, not just fail its own assertion — fixed by switching matchers.
  - **Added beyond the original task description:** a dedicated test, "documents that default gas estimation can silently skip the reward despite a funded registry" — calls `storeCid` with *no* gas override and shows the mint still succeeds while the reward silently doesn't land, even though the registry is fully funded and correctly configured. See Open Questions.
- [x] **7.** Create `test/VinCidRegistry.edgeCases.test.js`:
  - Non-standard token: deploy `NonStandardERC20Mock`, fund the registry with it, call `withdrawToken` for it as owner, and confirm the transfer succeeds despite no boolean return (exercises the `data.length == 0` branch).
  - Reentrancy: deploy `MaliciousReentrantReceiver` as the mint `recipient`, call `storeCid` from the minter, and assert the actual observed outcome — the outer call's `tokenURI` write executes *after* the reentrant inner call's, so the final `tokenURI` reflects the outer (original) CID while `getCidByVin` (the `vinToCid` mapping) reflects the inner (reentrant) CID. Document this divergence explicitly in the test's assertions and a comment — this test exists to pin down and describe current behavior, not to assert it's correct.
- [x] **8.** Add `test.mocha.reporter: process.env.MOCHA_REPORTER || "spec"` to `hardhat.config.js`'s exported config.
- [x] **9.** Create `scripts/generate-test-report.js` (ESM): spawns `npx hardhat test --gas-stats-json docs/testing/gas-report.json` with `MOCHA_REPORTER=json` in the child's env, piping child stdout/stderr both to the parent process (live feedback) and into `docs/testing/test-output.log`. **Implementation refinement vs. the original description:** rather than regex-parsing the spec reporter's text summary, it switches the child's reporter to Mocha's built-in `json` reporter (via the `MOCHA_REPORTER` env var read by task 8's `hardhat.config.js` change) and extracts the pretty-printed JSON object from the combined output (finds the first line that is exactly `{` and the last that is exactly `}`, since Hardhat prints its own text before/after the reporter's JSON) — gives structured per-test pass/fail/duration data instead of just a summary line. Parses `gas-report.json` per the documented shape (confirmed via a scratch probe during planning). Renders `docs/testing/automated-test-report.md`: title, run date, pass/fail summary, a per-suite test list, failure details on any failure, and a gas-usage table per contract. Exits with the child's exit code — verified by deliberately breaking a test: `npm run test:report` exited 1 and the report's Failures section rendered the actual assertion message.
- [x] **10.** Add `"test:report": "node scripts/generate-test-report.js"` to `package.json` scripts.
- [x] **11.** Add `docs/testing/test-output.log` and `docs/testing/gas-report.json` to `.gitignore` (regenerated intermediates); ran `npm run test:report` and committed the resulting `docs/testing/automated-test-report.md`.
- [x] **12.** Update `README.md` with a "Running the contract test suite" section: `npm test` for local dev feedback (spec reporter), `npm run test:report` to regenerate the committed report, and a link to `docs/testing/automated-test-report.md`.
- [x] **13.** Create `docs/memory/contracts/hardhat-automated-test-suite.md` and add its index line to `docs/memory/MEMORY.md`. Also added a second memory file, `docs/memory/contracts/reward-payout-gas-estimation-risk.md` (not in the original task list — see Open Questions), documenting the gas-estimation finding since it's a real production risk, not just a test-writing detail.

## Contract Surface

- No changes to `VinCidRegistry` or `CarRewardToken`.
- Two new test-only contracts under `contracts/mocks/` (`NonStandardERC20Mock`, `MaliciousReentrantReceiver`) — not referenced by `scripts/deploy.js`, which deploys `CarRewardToken` and `VinCidRegistry` by explicit factory name, so there is no path by which these mocks get deployed to Sepolia or any production network.

## Interfaces with Frontend

- None. No ABI, address, or event changes — see the paired frontend plan (no-op).

## Testing

- **Meta-verification (this plan's own correctness) — done:** temporarily broke a `CarRewardToken` assertion (expected symbol changed to a wrong value), confirmed the test failed with a clear diff, then restored it. Also caught two real issues this way during implementation rather than shipping them silently: a deprecated chai matcher that was corrupting later-test state (fixed by switching to `.revert(ethers)`), and the gas-estimation reward-payout gotcha (documented via a dedicated test, see Open Questions).
- `npm test` runs clean — **27/27 passing** against the contracts as they exist today.
- `npm run test:report` produces `docs/testing/automated-test-report.md` with an accurate pass count (27/27) and a non-empty gas table for all four compiled contracts (`VinCidRegistry`, `CarRewardToken`, plus the two mocks); re-run twice and confirmed idempotent (clean overwrite, no stale data).
- Confirmed the report generator correctly propagates a non-zero exit code when a test is deliberately broken — `npm run test:report` exited 1 and the report's Failures section showed the real assertion message (needed for ADR 0021's CI gate to work).

## Deployment and Migration

- Not applicable — test-only and tooling changes, no on-chain migration, no `scripts/deploy.js` changes.

## Risks and Rollback

- **Risk:** the reentrancy edge-case test documents a real (low-severity) state-divergence behavior rather than fixing it — see Open Questions.
- **Risk:** `contracts/mocks/*.sol` are compiled alongside production contracts (Hardhat compiles everything under `contracts/`) — negligible size/gas impact since they're never deployed, but worth knowing they exist if `npm run compile`'s artifact count grows.
- **Rollback:** delete `test/`, `contracts/mocks/`, `scripts/generate-test-report.js`, revert `package.json`/`hardhat.config.js`/`.gitignore`/`README.md` diffs, remove `docs/testing/automated-test-report.md`. No on-chain or deployed-contract effect either way.

## Open Questions

- The reentrancy finding in task 7 (`vinToCid` vs. `tokenURI` divergence when `recipient` is a malicious contract during the *first* mint of a VIN) is real but low-severity — `recipient` in this system's intended usage is the car owner's own wallet, not an attacker's, so the practical blast radius is "you can confuse your own record," not fund loss. Should a follow-up ADR propose actually fixing it (e.g. moving `_setTokenURI` before `_safeMint`, or a reentrancy guard), or is documenting it via this test sufficient for now? Left for the user to decide — not addressed by this plan.
- **New finding, discovered while writing task 6's reward-payout tests:** `storeCid`'s CRT reward can silently fail to pay out under *default* gas estimation (`eth_estimateGas`, no explicit `gasLimit`) even when the registry is fully funded and correctly configured — see `docs/memory/contracts/reward-payout-gas-estimation-risk.md` for the full mechanism (the `try/catch` around `_payReward` masks an inner out-of-gas from the estimator's binary search). This is a real production risk: the frontend's `storeCidOnBlockchain` call goes through MetaMask, whose own gas estimation isn't guaranteed to pad enough for this case, meaning real users could mint successfully but silently not receive their CRT reward. Should this be fixed — e.g. the frontend passing a generous explicit gas limit on `storeCid` calls, or the contract restructuring `_payReward` — or is documenting/monitoring it sufficient for now? Left for the user to decide; not addressed by this plan (tests use an explicit `gasLimit` override to stay deterministic, and one test documents the failure mode itself).
