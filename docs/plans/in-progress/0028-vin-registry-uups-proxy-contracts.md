# Plan 0028 — UUPS proxy for VinCidRegistry — Contracts

- **ADR:** `docs/adr/0028-vin-registry-uups-proxy.md`
- **Paired plan:** `docs/plans/in-progress/0028-vin-registry-uups-proxy-frontend.md`
- **Status:** in-progress
- **Date:** 2026-07-29

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Convert `VinCidRegistry` to an upgradeable contract behind a UUPS (`ERC1967Proxy`) proxy so registered VIN/CID data (and reward configuration) survives future logic upgrades, per ADR 0028. Split today's single `scripts/deploy.js` into a one-time bootstrap script and a new `scripts/upgrade.js` for all subsequent upgrades. `CarRewardToken` is explicitly out of scope — it stays a plain non-upgradeable ERC-20, deployed once during bootstrap and never redeployed again once the registry is proxy-backed.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `package.json` | modify | Add `@openzeppelin/contracts-upgradeable` (`^5.6.1`, matching the existing `@openzeppelin/contracts` version) as a dependency. |
| `contracts/car_nft_sc.sol` | modify | Switch to upgradeable base contracts; replace constructor with `initialize(...)`; add `_authorizeUpgrade`; add storage gap. |
| `scripts/deploy.js` | modify | Becomes bootstrap-only: deploy `CarRewardToken`, deploy `VinCidRegistry` implementation, deploy `ERC1967Proxy` with encoded `initialize` calldata, persist the **proxy** address. Guard against re-running against a network that already has a bootstrapped proxy (would silently create a second, disconnected registry). |
| `scripts/upgrade.js` | add | Deploy a new `VinCidRegistry` implementation only, call `upgradeToAndCall` on the existing proxy (read from `deployments/<network>.json`), re-sync the ABI. Does not touch `CarRewardToken` or the stored addresses. |
| `test/VinCidRegistry.upgrade.test.js` | add | Verifies pre-upgrade state (registered VINs, `rewardAmount`, `minter`) survives an upgrade to a `VinCidRegistryV2Mock`; verifies non-owner `upgradeToAndCall` reverts. |
| `test/fixtures.js` | modify | Add a fixture that deploys `VinCidRegistry` behind a proxy (implementation + `ERC1967Proxy` + `initialize`) for the upgrade test, alongside the existing non-proxy fixture used by current tests. |
| `contracts/mocks/VinCidRegistryV2Mock.sol` | add | *(Path corrected mid-implementation: this project's existing convention is `contracts/mocks/`, not `contracts/test-mocks/` as originally written — see `contracts/mocks/NonStandardERC20Mock.sol`.)* Standalone contract mirroring `VinCidRegistry`'s full storage layout and external functions through `minter`, plus one appended field and a `versionTag()` view, used solely to prove storage-layout safety across an upgrade in the test above. |
| `deployments/<network>.json` | schema change | Add `implementation` (current logic contract address) alongside the existing `registry` field, which now holds the **proxy** address. `deployedAtBlock` continues to mean the proxy's deployment block (needed for ADR 0027's event-scan `fromBlock`, since `CidStored` events are emitted at the proxy address). |
| `scripts/deployUtils.js` | add | *(Unplanned, added mid-implementation.)* Shared helpers (`upsertEnvVar`, `syncFrontendAbi`, `writeSepoliaDeployLog`) extracted so `scripts/deploy.js` and `scripts/upgrade.js` don't duplicate the ABI-sync/env-var/deploy-log logic task 9 requires both scripts to perform. |
| `hardhat.config.js` | modify | *(Unplanned, added mid-implementation.)* Added `solidity.npmFilesToBuild: ["@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol"]` — Hardhat 3 only emits artifacts for files under `contracts/` by default, and nothing there imports `ERC1967Proxy` (it's deployed directly via `ethers.getContractFactory`), so no artifact existed for it until this was added. |

## Tasks

- [x] **1.** Added `@openzeppelin/contracts-upgradeable@^5.6.1` to `package.json` and installed.
- [x] **2.** Rewrote `contracts/car_nft_sc.sol`: swapped to `ERC721URIStorageUpgradeable`/`OwnableUpgradeable`/`UUPSUpgradeable`/`Initializable`. Replaced the constructor with `initialize(address rewardTokenAddress, address initialMinter) public initializer`, calling `__ERC721_init`, `__ERC721URIStorage_init`, `__Ownable_init` plus the existing minter/reward-token assignment logic (unchanged behavior otherwise). *(Deviation from this task's original text: there is no `__UUPSUpgradeable_init()` — confirmed by reading `node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol`, which is a stateless re-export of the non-upgradeable `UUPSUpgradeable` and has no initializer to call.)* Added `constructor() { _disableInitializers(); }`, `_authorizeUpgrade(address) internal override onlyOwner {}`, and `uint256[50] private __gap;` as the final state variable.
- [x] **3.** Added `contracts/mocks/VinCidRegistryV2Mock.sol` (path corrected — see Files table). *(Deviation: a bare subclass adding only a new field/view didn't work — `VinCidRegistryV2Mock` doesn't inherit from `VinCidRegistry`, so calling `storeCid`/`getAllVins`/etc. through it as the post-upgrade implementation failed with "not a function." Fixed by having the mock re-declare the full original function set too, exactly mirroring what a real next version of the contract would look like — same storage layout, same external interface, plus one new field/function.)*
- [x] **4.** Added `deployRegistryProxy(ethers, tokenAddress, initialMinter)` to `test/fixtures.js`: deploys the implementation, deploys `ERC1967Proxy` with encoded `initialize` calldata, returns an ethers instance attached to the proxy address. `deployRegistryFixture` now calls it instead of deploying `VinCidRegistry` directly.
- [x] **5.** Added `test/VinCidRegistry.upgrade.test.js`: registers two VINs against the proxy, upgrades to `VinCidRegistryV2Mock`, asserts `getAllVins()`/`getCidByVin()`/`rewardAmount`/`minter`/NFT ownership are unchanged, `versionTag()`/`newFeatureFlag()` work and start empty, `storeCid` still works post-upgrade, a non-owner `upgradeToAndCall` reverts, and the proxy address is unchanged by the upgrade.
- [x] **6.** Ran the full suite (`npm test`): updated `test/VinCidRegistry.test.js`'s `constructor` describe block to `initialize` (now testing `deployRegistryProxy` instead of a direct `Registry.deploy(...)` call), added cases for double-initialize and initializing the implementation directly, both asserting `InvalidInitialization` (OZ v5's `Initializable` custom error). All 32 tests pass, including the 4 pre-existing suites and the new upgrade suite.
- [x] **7.** Rewrote `scripts/deploy.js` as bootstrap-only: implementation deploy + `ERC1967Proxy` deploy with encoded `initialize` calldata; persists `registry` (proxy) + `implementation`. Guard implemented as a `FORCE_FRESH_DEPLOY=1` env var (not a `--force-fresh` CLI flag as originally written — consistent with the script's existing env-var-driven options like `REWARD_AMOUNT`/`REWARD_FUND`/`INITIAL_MINTER`, and avoids Hardhat's `hardhat run` argument-forwarding complications). Verified live: running `deploy:local` against an existing `deployments/localhost.json` correctly refused and named `upgrade:local` instead; `FORCE_FRESH_DEPLOY=1` bootstrapped a fresh proxy.
- [x] **8.** Added `scripts/upgrade.js` as specified; added `upgrade:local`/`upgrade:sepolia` to `package.json`. Verified live on `localhost`: deployed a new implementation, called `upgradeToAndCall`, proxy address and previously-registered VIN both unchanged, ABI re-synced.
- [x] **9.** `writeSepoliaDeployLog` (in the new `scripts/deployUtils.js`) takes a `kind: "bootstrap" | "upgrade"` parameter and is called from both scripts on Sepolia, varying the heading/rows accordingly (upgrade entries omit the unchanged `CarRewardToken` row).
- [x] **10.** ~~Resolve the open question~~ **Resolved 2026-07-30: accept the current live Sepolia registry's data as a one-time loss at cutover.** No migration script is written; bootstrapping the proxy on Sepolia starts with empty registry state, same as any other fresh deploy today. See `docs/decisions/2026-07-30-001-accept-sepolia-data-loss-at-cutover.md`.

## Contract Surface

- **Removed:** the public constructor `constructor(address rewardTokenAddress, address initialMinter)`.
- **Added:** `function initialize(address rewardTokenAddress, address initialMinter) public initializer` — same parameters and effects as the old constructor, callable exactly once (enforced by `initializer`).
- **Added:** `function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}` — gates `upgradeToAndCall` (inherited from `UUPSUpgradeable`) to the contract `owner()`. `minter` (mint authority) and `owner` (upgrade authority) remain distinct roles, unchanged from today.
- **Unchanged:** `storeCid`, `getCidByVin`, `getAllVins`, `getAllCidsAsList`, `setMinter`, `withdrawToken`, `setRewardToken`, `setRewardAmount`, and the `CidStored`/`TokensWithdrawn`/`MinterChanged` events — same signatures, same behavior, called through the proxy.
- **Storage layout:** existing fields (`vinToCid`, `tokenIdToVin`, `vinKeys`, `rewardToken`, `rewardAmount`, `minter`) keep their current slot order; a `uint256[50] private __gap` is appended so future upgrades can add fields without shifting anything. Any future change to this contract **must** append new state after the gap (shrinking the gap accordingly) and never reorder or remove existing fields — this is a manual discipline in this project (no `hardhat-upgrades` plugin doing automated layout checks, per ADR 0028).
- **Access control:** unchanged mint gating (`minter`-only on new mints); new upgrade gating (`owner`-only via `_authorizeUpgrade`).
- **Gas considerations:** every call through the proxy pays a small fixed `DELEGATECALL` overhead versus calling a plain contract directly (accepted per ADR 0028). Upgrades themselves cost a normal contract deployment (new implementation) plus one cheap storage-slot write (the proxy's implementation slot) — flat cost regardless of registry size, unlike a migration-script replay.

## Interfaces with Frontend

- ABI: still exported by copying the compiled `VinCidRegistry` artifact into `frontend/src/utils/contract_abi.json` — now happens on **both** `scripts/deploy.js` (bootstrap) and `scripts/upgrade.js` (every upgrade), since upgrades may add new methods.
- Address: `REACT_APP_SMART_CONTRACT_ADDRESS` / `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` now hold the **proxy** address, synced once at bootstrap. `scripts/upgrade.js` does **not** touch this env var — the address is stable across upgrades by design.
- `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` (ADR 0027): continues to mean the proxy's own deployment block, since `CidStored` events are emitted at the proxy address regardless of which implementation is active.
- No change to function signatures or event shapes the frontend already calls/consumes.

## Testing

- `test/VinCidRegistry.upgrade.test.js` (new): state survives an upgrade; non-owner upgrade attempts revert.
- Existing `test/VinCidRegistry.test.js` and `test/VinCidRegistry.edgeCases.test.js`: update their fixture usage to go through `initialize` via the proxy fixture instead of the removed constructor; all existing assertions should otherwise pass unchanged since the contract's external behavior is not changing.
- `test/CarRewardToken.test.js`: unaffected, no changes expected.
- Local integration: `npm run deploy:local` (bootstrap) against a fresh Hardhat node, register a VIN, run `npm run upgrade:local`, confirm the VIN is still readable via `getAllVins()`/`getCidByVin()` and the frontend's "Show all registered NFTs" still lists it — this is the concrete regression test for the exact symptom that started this investigation. **Done 2026-07-30:** bootstrapped locally, registered `1HGCM82633A004352`, upgraded, confirmed `getAllVins()` still returned it via a throwaway script run against `--network localhost`; confirmed `frontend/.env.local`'s `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` was untouched by the upgrade; confirmed `npm start` compiles cleanly against the resynced ABI (full wallet-driven click-through wasn't possible in this headless container — no browser/`chromium-cli` available — see the paired frontend plan's Testing section).
- Security checks: confirm `initialize` cannot be called twice (reverts on the proxy after bootstrap, and directly on the implementation address due to `_disableInitializers`); confirm only `owner()` can upgrade; confirm the implementation contract itself (not the proxy) cannot be used to mint/store (accessing it directly bypasses the proxy's storage, so any state written there is inert — call this out in a test comment, not a runtime guard, since it's inherent to the pattern).

## Deployment and Migration

- **Bootstrap** (one-time per network, replaces today's `deploy.js` behavior): deploy `CarRewardToken`, deploy `VinCidRegistry` implementation, deploy `ERC1967Proxy` with `initialize` calldata, persist `registry` (proxy) + `implementation` addresses.
- **Upgrade** (every subsequent change): `scripts/upgrade.js` deploys a new implementation and calls `upgradeToAndCall` — no new proxy, no new `CarRewardToken`, no frontend address change.
- **Sepolia cutover data:** resolved — accept the loss (task 10), no migration script.
- **Network sequence:** verify the whole bootstrap → register → upgrade → verify-data-survives cycle on `localhost` first (**done 2026-07-30**), then repeat on Sepolia. **Sepolia bootstrapped 2026-07-30** (user-approved): `FORCE_FRESH_DEPLOY=1 npm run deploy:sepolia` — proxy `0x9e30596A7C80754cd5149A465e89758CAdB0F8B3`, implementation `0xdE69ad20A6169bEf874488C6306361Cfd9cbE264`, `CarRewardToken` `0x854966B53849f7fF12Bad90293E1eD2DcADc913e`, block 11385148. `docs/deployments/sepolia_contract_deploy_addresses_2026-07-30.md` written. As expected/accepted, the previously-live registrations are gone from this new registry. The Sepolia *upgrade* path (`npm run upgrade:sepolia`) has not been exercised yet — only bootstrap.
- **Verification on Etherscan:** both the proxy and the implementation contract addresses should be verified; Etherscan's proxy-detection UI will then show the read/write tabs against the current implementation's ABI automatically.

## Risks and Rollback

- **Risk:** a future upgrade that reorders/removes existing state variables silently corrupts storage (classic proxy pitfall) — mitigated by the storage gap, the append-only discipline documented above, and the upgrade test, but not by any automated tool (accepted per ADR 0028's choice to skip the `hardhat-upgrades` plugin).
- **Risk:** calling `initialize` a second time, or calling it directly on the implementation address instead of the proxy — mitigated by `initializer` (one-shot) and `_disableInitializers()` in the implementation's constructor.
- **Risk:** losing upgrade authority (e.g. `owner()` key lost) would permanently freeze the contract's logic — same key-custody risk the project already has via `Ownable`/`onlyOwner` elsewhere (`setMinter`, `withdrawToken`), not a new category of risk.
- **Rollback:** an upgrade can itself be rolled back by upgrading again to the previous implementation's address (kept in `deployments/<network>.json` history / git history of that file). There is no "pause" mechanism in the contract today; add one only if the user asks (out of scope here).

## Open Questions

None — the only open question (migrate vs. accept loss at Sepolia cutover) was resolved 2026-07-30; see task 10.
