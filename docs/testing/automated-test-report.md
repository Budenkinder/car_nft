# Automated Hardhat Test Report

Generated 2026-07-28T12:33:59.848Z by `npm run test:report`. Regenerate after changing `test/` or the contracts under test — this file is committed so test coverage and gas costs are visible without running anything.

## Summary

**27 passing / 0 failing** out of 27 tests (135ms)

## Tests

- **CarRewardToken constructor**
  - ✓ sets name, symbol, and decimals (34ms)
  - ✓ mints the full initial supply to the deployer (2ms)
  - ✓ sets the deployer as owner (1ms)
- **CarRewardToken mint**
  - ✓ reverts for a non-owner caller (6ms)
  - ✓ increases balance and total supply when called by the owner (3ms)
- **VinCidRegistry edge cases withdrawToken — non-standard ERC-20 (no bool return)**
  - ✓ succeeds despite the token's transfer returning no boolean (16ms)
- **VinCidRegistry edge cases reentrancy during the first mint**
  - ✓ leaves vinToCid and the NFT's tokenURI pointing at different CIDs — documented, not fixed (14ms)
- **VinCidRegistry constructor**
  - ✓ reverts when initialMinter is the zero address (10ms)
  - ✓ sets the minter and emits MinterChanged on deploy (4ms)
- **VinCidRegistry storeCid — new mint**
  - ✓ mints the NFT to recipient, sets tokenURI, emits CidStored, and pays the reward (4ms)
  - ✓ reverts when the VIN is not 17 characters (1ms)
  - ✓ reverts when the CID is empty (1ms)
  - ✓ reverts when called by anyone other than the minter (1ms)
  - ✓ reverts when recipient is the zero address (1ms)
- **VinCidRegistry storeCid — update**
  - ✓ allows any caller to update the CID without minting a new token or paying a reward again (12ms)
- **VinCidRegistry admin: setMinter**
  - ✓ reverts for a non-owner caller (1ms)
  - ✓ reverts when the new minter is the zero address (1ms)
  - ✓ emits MinterChanged and updates minter() on success (2ms)
- **VinCidRegistry admin: setRewardToken / setRewardAmount**
  - ✓ setRewardToken reverts for non-owner and updates rewardToken() on success (2ms)
  - ✓ setRewardAmount reverts for non-owner and updates rewardAmount() on success (3ms)
- **VinCidRegistry admin: withdrawToken**
  - ✓ reverts for a non-owner caller (1ms)
  - ✓ reverts when `to` is the zero address (1ms)
  - ✓ transfers the registry's balance and emits TokensWithdrawn (2ms)
- **VinCidRegistry reward payout edge case**
  - ✓ mint still succeeds when the registry holds no reward tokens (4ms)
  - ✓ documents that default gas estimation can silently skip the reward despite a funded registry (2ms)
- **VinCidRegistry view functions**
  - ✓ getAllVins/getAllCidsAsList are empty on a fresh registry (1ms)
  - ✓ keep VIN/CID lists parallel and ordered across multiple mints (3ms)

## Gas Usage

### VinCidRegistry (`contracts/car_nft_sc.sol`)

**Deployment:** avg 1,977,814 gas (min 1,977,804 / max 1,977,816), runtime size 8,302 bytes, n=5

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `getAllCidsAsList` | 33,911 | 23,810 | 44,012 | 2 |
| `getAllVins` | 26,791 | 23,679 | 29,902 | 4 |
| `getCidByVin` | 29,527 | 29,527 | 29,527 | 3 |
| `minter` | 23,490 | 23,490 | 23,490 | 2 |
| `ownerOf` | 24,192 | 24,192 | 24,192 | 5 |
| `rewardAmount` | 23,424 | 23,424 | 23,424 | 1 |
| `rewardToken` | 23,488 | 23,488 | 23,488 | 1 |
| `setMinter` | 30,757 | 30,757 | 30,757 | 1 |
| `setRewardAmount` | 42,399 | 28,729 | 45,817 | 5 |
| `setRewardToken` | 29,005 | 29,005 | 29,005 | 1 |
| `storeCid` | 280,859 | 51,455 | 340,735 | 8 |
| `tokenURI` | 31,562 | 31,562 | 31,562 | 3 |
| `withdrawToken` | 48,573 | 37,914 | 55,014 | 3 |

### CarRewardToken (`contracts/car_reward_token.sol`)

**Deployment:** avg 660,390 gas (min 660,390 / max 660,390), runtime size 2,178 bytes, n=5

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `balanceOf` | 23,987 | 23,980 | 23,992 | 12 |
| `decimals` | 21,329 | 21,329 | 21,329 | 1 |
| `mint` | 53,602 | 53,602 | 53,602 | 1 |
| `name` | 24,150 | 24,150 | 24,150 | 1 |
| `owner` | 23,431 | 23,431 | 23,431 | 1 |
| `symbol` | 24,171 | 24,171 | 24,171 | 1 |
| `totalSupply` | 23,389 | 23,389 | 23,389 | 3 |
| `transfer` | 51,603 | 51,603 | 51,603 | 4 |

### MaliciousReentrantReceiver (`contracts/mocks/MaliciousReentrantReceiver.sol`)

**Deployment:** avg 392,961 gas (min 392,961 / max 392,961), runtime size 1,571 bytes, n=1

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `arm` | 157,417 | 157,417 | 157,417 | 1 |

### NonStandardERC20Mock (`contracts/mocks/NonStandardERC20Mock.sol`)

**Deployment:** avg 188,323 gas (min 188,323 / max 188,323), runtime size 515 bytes, n=1

| Function | Avg gas | Min | Max | Calls |
|---|---|---|---|---|
| `balanceOf` | 23,917 | 23,917 | 23,917 | 1 |
| `transfer` | 49,629 | 49,629 | 49,629 | 1 |

