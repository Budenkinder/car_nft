# Automated Hardhat Test Report

Generated 2026-08-04T23:01:55.539Z by `npm run test:report`. Regenerate after changing `test/` or the contracts under test — this file is committed so test coverage and gas costs are visible without running anything.

## Summary

**40 passing / 0 failing** out of 40 tests (297ms)

## Tests

- **CarRewardToken constructor**
  - ✓ sets name, symbol, and decimals (34ms)
  - ✓ mints the full initial supply to the deployer (2ms)
  - ✓ sets the deployer as owner (0ms)
- **CarRewardToken mint**
  - ✓ reverts for a non-owner caller (7ms)
  - ✓ increases balance and total supply when called by the owner (3ms)
- **VinCidRegistry edge cases withdrawToken — non-standard ERC-20 (no bool return)**
  - ✓ succeeds despite the token's transfer returning no boolean (21ms)
- **VinCidRegistry edge cases reentrancy during the first mint**
  - ✓ reverts the entire mint when the reentrant call comes from a wallet without ORG_ROLE (ADR 0035 narrows this hole, does not close it) (19ms)
- **VinCidRegistry roles (ADR 0035) ORG_ROLE gating**
  - ✓ the incumbent minter retains ORG_ROLE post-migration and can mint (14ms)
  - ✓ a non-org wallet cannot mint (1ms)
  - ✓ a non-org wallet cannot update an existing VIN (14ms)
  - ✓ an ORG_ROLE wallet can both mint and update (5ms)
- **VinCidRegistry roles (ADR 0035) DEFAULT_ADMIN_ROLE grant/revoke**
  - ✓ reverts when a non-admin tries to grantRole (2ms)
  - ✓ the deployer-admin can grant ORG_ROLE to an arbitrary wallet (2ms)
  - ✓ a revoked org loses both mint and update abilities (17ms)
- **VinCidRegistry roles (ADR 0035) initializeV2**
  - ✓ cannot be called a second time (1ms)
  - ✓ reverts when the admin address is the zero address (9ms)
- **VinCidRegistry initialize**
  - ✓ reverts when initialMinter is the zero address (17ms)
  - ✓ sets minter() on deploy (deprecated storage, retained for layout compatibility) (6ms)
  - ✓ reverts when called a second time on an already-initialized proxy (1ms)
  - ✓ reverts when called directly on the implementation contract (not through the proxy) (5ms)
- **VinCidRegistry storeCid — new mint**
  - ✓ mints the NFT to recipient, sets tokenURI, emits CidStored, and pays the reward (4ms)
  - ✓ reverts when the VIN is not 17 characters (1ms)
  - ✓ reverts when the CID is empty (1ms)
  - ✓ reverts when called by a wallet without ORG_ROLE (1ms)
  - ✓ reverts when recipient is the zero address (1ms)
- **VinCidRegistry storeCid — update**
  - ✓ allows an ORG_ROLE wallet to update the CID without minting a new token or paying a reward again (16ms)
  - ✓ reverts when a non-org wallet tries to update an existing VIN (ADR 0035 regression) (1ms)
- **VinCidRegistry admin: setRewardToken / setRewardAmount**
  - ✓ setRewardToken reverts for non-owner and updates rewardToken() on success (3ms)
  - ✓ setRewardAmount reverts for non-owner and updates rewardAmount() on success (2ms)
- **VinCidRegistry admin: withdrawToken**
  - ✓ reverts for a non-owner caller (1ms)
  - ✓ reverts when `to` is the zero address (1ms)
  - ✓ transfers the registry's balance and emits TokensWithdrawn (3ms)
- **VinCidRegistry reward payout edge case**
  - ✓ mint still succeeds when the registry holds no reward tokens (4ms)
  - ✓ documents that default gas estimation can silently skip the reward despite a funded registry (2ms)
- **VinCidRegistry view functions**
  - ✓ getAllVins/getAllCidsAsList are empty on a fresh registry (1ms)
  - ✓ keep VIN/CID lists parallel and ordered across multiple mints (3ms)
- **VinCidRegistry upgrade (UUPS proxy)**
  - ✓ preserves registered VINs/CIDs, reward config, and minter across an upgrade (25ms)
  - ✓ reverts when a non-owner calls upgradeToAndCall (16ms)
  - ✓ the proxy address is unchanged by an upgrade (4ms)
- **VinCidRegistry ADR 0035 migration (pre-ORG_ROLE -> ORG_ROLE)**
  - ✓ preserves all pre-upgrade state byte-for-byte and bootstraps roles via initializeV2 (25ms)

## Gas Usage

### ERC1967Proxy (`@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol`)

**Deployment:** avg 268,816 gas (min 268,693 / max 270,166), runtime size 163 bytes, n=12

### VinCidRegistry (`contracts/car_nft_sc.sol`)

**Deployment:** avg 2,706,898 gas (min 2,706,898 / max 2,706,898), runtime size 12,152 bytes, n=14

### VinCidRegistry (`contracts/car_nft_sc.sol`)

**Deployment:** avg 2,706,898 gas (min 2,706,898 / max 2,706,898), runtime size 12,152 bytes, n=14

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `DEFAULT_ADMIN_ROLE` | 26,205 | 26,205 | 26,205 | 2 |
| `getAllCidsAsList` | 38,873 | 28,750 | 48,995 | 2 |
| `getAllVins` | 31,735 | 28,607 | 34,863 | 5 |
| `getCidByVin` | 34,496 | 34,496 | 34,496 | 5 |
| `grantRole` | 56,547 | 56,547 | 56,547 | 2 |
| `hasRole` | 29,595 | 29,259 | 29,643 | 8 |
| `initializeV2` | 85,166 | 85,166 | 85,166 | 10 |
| `minter` | 28,394 | 28,394 | 28,394 | 2 |
| `ORG_ROLE` | 26,272 | 26,272 | 26,272 | 7 |
| `ownerOf` | 29,177 | 29,177 | 29,177 | 5 |
| `revokeRole` | 34,627 | 34,627 | 34,627 | 1 |
| `rewardAmount` | 28,349 | 28,349 | 28,349 | 2 |
| `rewardToken` | 28,413 | 28,413 | 28,413 | 1 |
| `setRewardAmount` | 49,066 | 33,687 | 50,775 | 10 |
| `setRewardToken` | 33,963 | 33,963 | 33,963 | 1 |
| `storeCid` | 265,576 | 58,892 | 324,982 | 15 |
| `tokenURI` | 36,485 | 36,485 | 36,485 | 2 |
| `upgradeToAndCall` | 37,702 | 37,702 | 37,702 | 2 |
| `withdrawToken` | 53,523 | 42,860 | 59,960 | 3 |

### CarRewardToken (`contracts/car_reward_token.sol`)

**Deployment:** avg 660,390 gas (min 660,390 / max 660,390), runtime size 2,178 bytes, n=12

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `balanceOf` | 23,987 | 23,980 | 23,992 | 12 |
| `decimals` | 21,329 | 21,329 | 21,329 | 1 |
| `mint` | 53,602 | 53,602 | 53,602 | 1 |
| `name` | 24,150 | 24,150 | 24,150 | 1 |
| `owner` | 23,431 | 23,431 | 23,431 | 1 |
| `symbol` | 24,171 | 24,171 | 24,171 | 1 |
| `totalSupply` | 23,389 | 23,389 | 23,389 | 3 |
| `transfer` | 51,603 | 51,603 | 51,603 | 10 |

### MaliciousReentrantReceiver (`contracts/mocks/MaliciousReentrantReceiver.sol`)

**Deployment:** avg 392,961 gas (min 392,961 / max 392,961), runtime size 1,571 bytes, n=1

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `arm` | 157,417 | 157,417 | 157,417 | 1 |

### NonStandardERC20Mock (`contracts/mocks/NonStandardERC20Mock.sol`)

**Deployment:** avg 188,311 gas (min 188,311 / max 188,311), runtime size 515 bytes, n=1

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `balanceOf` | 23,917 | 23,917 | 23,917 | 1 |
| `transfer` | 49,629 | 49,629 | 49,629 | 1 |

### VinCidRegistryV1Mock (`contracts/mocks/VinCidRegistryV1Mock.sol`)

**Deployment:** avg 2,453,177 gas (min 2,453,177 / max 2,453,177), runtime size 10,979 bytes, n=1

### VinCidRegistryV1Mock (`contracts/mocks/VinCidRegistryV1Mock.sol`)

**Deployment:** avg 2,453,177 gas (min 2,453,177 / max 2,453,177), runtime size 10,979 bytes, n=1

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `setRewardAmount` | 50,731 | 50,731 | 50,731 | 1 |
| `storeCid` | 324,721 | 324,721 | 324,721 | 1 |
| `upgradeToAndCall` | 37,746 | 37,746 | 37,746 | 1 |

### VinCidRegistryV2Mock (`contracts/mocks/VinCidRegistryV2Mock.sol`)

**Deployment:** avg 2,362,160 gas (min 2,362,160 / max 2,362,160), runtime size 10,558 bytes, n=3

### VinCidRegistryV2Mock (`contracts/mocks/VinCidRegistryV2Mock.sol`)

**Deployment:** avg 2,362,160 gas (min 2,362,160 / max 2,362,160), runtime size 10,558 bytes, n=3

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `getAllCidsAsList` | 48,961 | 48,961 | 48,961 | 1 |
| `getAllVins` | 34,819 | 34,819 | 34,819 | 1 |
| `getCidByVin` | 34,472 | 34,472 | 34,472 | 3 |
| `minter` | 28,394 | 28,394 | 28,394 | 1 |
| `newFeatureFlag` | 29,049 | 28,958 | 29,140 | 2 |
| `ownerOf` | 29,133 | 29,133 | 29,133 | 2 |
| `rewardAmount` | 28,305 | 28,305 | 28,305 | 1 |
| `setNewFeatureFlag` | 51,671 | 51,671 | 51,671 | 1 |
| `storeCid` | 56,419 | 56,419 | 56,419 | 1 |
| `versionTag` | 26,516 | 26,516 | 26,516 | 1 |

