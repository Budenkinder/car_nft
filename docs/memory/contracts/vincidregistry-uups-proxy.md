---
name: vincidregistry-uups-proxy
description: VinCidRegistry is now a UUPS-upgradeable contract behind an ERC1967Proxy (ADR 0028); bootstrap/upgrade via scripts/deploy.js and scripts/upgrade.js
metadata:
  type: project
  scope: contracts
---

`contracts/car_nft_sc.sol` (`VinCidRegistry`) is a UUPS-upgradeable contract (`Initializable`, `ERC721URIStorageUpgradeable`, `OwnableUpgradeable`, `UUPSUpgradeable`) deployed behind a manually-deployed `ERC1967Proxy` — implemented per ADR 0028 (`docs/adr/0028-vin-registry-uups-proxy.md`) and its paired plans (`docs/plans/in-progress/0028-vin-registry-uups-proxy-{frontend,contracts}.md`). This replaced the old plain-constructor contract that reset all storage (`vinToCid`/`tokenIdToVin`/`vinKeys`) on every redeploy — the root cause of "Show all registered NFTs" going empty after a Sepolia redeploy, previously tracked under this same memory file.

**Deploy model, as of 2026-07-30:**
- `scripts/deploy.js` is now **bootstrap-only** — deploys `CarRewardToken`, the `VinCidRegistry` implementation, and an `ERC1967Proxy` calling `initialize(rewardTokenAddress, initialMinter)`. It refuses to run again against a network with an existing `registry` in `deployments/<network>.json` (guards against silently creating a second, disconnected proxy) unless `FORCE_FRESH_DEPLOY=1` is set.
- `scripts/upgrade.js` (new) is how every subsequent contract change ships: deploys a new implementation only, calls `proxy.upgradeToAndCall(newImpl, "0x")` (owner-gated via `_authorizeUpgrade`), re-syncs the ABI. **The registry (proxy) address never changes after bootstrap** — `REACT_APP_SMART_CONTRACT_ADDRESS`/`_LOCAL` in `frontend/.env.local` is a one-time sync now, not a per-deploy one. `npm run upgrade:local` / `npm run upgrade:sepolia` run it.
- `deployments/<network>.json` gained an `implementation` field (current logic contract) alongside `registry` (proxy, stable) and an `upgradedAt` timestamp after the first upgrade.
- Any future change to `VinCidRegistry`'s state variables **must only append after `__gap`** (currently `uint256[50]`) — never reorder/remove existing fields, or an upgrade corrupts storage. There's no `hardhat-upgrades`-plugin safety net for this (deliberately skipped, see ADR 0028) — it's manual discipline, checked by `test/VinCidRegistry.upgrade.test.js`.
- `ERC1967Proxy` needed `hardhat.config.js`'s `solidity.npmFilesToBuild` to get an artifact at all — Hardhat 3 only auto-artifacts files under `contracts/`, and nothing there imports it (it's deployed directly via `ethers.getContractFactory`).

**Verified locally (2026-07-30):** bootstrap → register a VIN → upgrade → VIN still readable via `getAllVins()`/`getCidByVin()`, proxy address unchanged, ABI resynced, `npm start` compiles clean against it.

**Live on Sepolia as of 2026-07-30** (user-approved, `docs/decisions/2026-07-30-003-sepolia-proxy-bootstrap.md`): proxy (`registry`) `0x9e30596A7C80754cd5149A465e89758CAdB0F8B3`, implementation `0xdE69ad20A6169bEf874488C6306361Cfd9cbE264`, `CarRewardToken` `0x854966B53849f7fF12Bad90293E1eD2DcADc913e`, deployed at block `11385148`. Per the user's earlier decision to accept data loss at cutover (`docs/decisions/2026-07-30-001-accept-sepolia-data-loss-at-cutover.md`), the previous live registrations are gone — this is expected, one-time, and won't recur on future upgrades. **Still outstanding:** the Vercel Production env vars (`REACT_APP_SMART_CONTRACT_ADDRESS`, `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK`) need a manual update by the user to these new values, followed by a redeploy of `main` — this couldn't be done from this session (no Vercel access). Until that happens, the deployed Vercel frontend is still pointed at the old, pre-proxy Sepolia address. The Sepolia *upgrade* path (`npm run upgrade:sepolia`) has not been exercised yet, only bootstrap.

**How to apply:** [[deploy-syncs-frontend]] and [[sepolia-deploy-log]] describe the *old*, pre-proxy deploy behavior — treat their address/ABI-sync mechanics as superseded by this file for anything involving the registry specifically (`CarRewardToken`'s deploy/log behavior is unchanged). If asked why the registry address didn't change after a contract update, or why "Show all registered NFTs" still works post-upgrade, this is why.
