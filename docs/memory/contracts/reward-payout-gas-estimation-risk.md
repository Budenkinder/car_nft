---
name: reward-payout-gas-estimation-risk
description: storeCid's CRT reward can silently not pay out under default/naive gas estimation, even with a fully funded registry — a try/catch + eth_estimateGas interaction, not a balance issue.
metadata:
  type: project
  scope: contracts
---

`VinCidRegistry._payReward` wraps the CRT transfer in `try { rewardToken.transfer(to, rewardAmount) } catch {}` so a failed reward never blocks the mint (see [contracts/car_nft_sc.sol:130-133](../../../contracts/car_nft_sc.sol#L130)). Confirmed by direct experiment (see `test/VinCidRegistry.test.js`, "documents that default gas estimation can silently skip the reward despite a funded registry"): calling `storeCid` with **no explicit `gasLimit`** — i.e. relying on `eth_estimateGas`'s default binary search — can mint successfully while the reward transfer inside the `try` silently runs out of gas and is swallowed. The registry was fully funded and correctly configured in the reproduction; the only variable was leaving gas estimation to its default.

**Why:** `eth_estimateGas`'s search only needs "enough gas that the *outer* call doesn't revert." Because the try/catch absorbs an out-of-gas inner transfer without reverting the outer call, the estimator has no signal that the inner call needs more headroom — it can converge on a gas limit that's exactly enough for "mint succeeds" but not "mint succeeds *and* reward lands." Passing an explicit generous `gasLimit` (tests use `500_000n`, well above the ~230k typically used) makes the reward land reliably every time.

**How to apply:** This is a real risk for production, not just a test artifact — the frontend's mint flow (`frontend/src/utils/pinata_ipfs_nft_service.js` → `storeCidOnBlockchain`) goes through MetaMask, which also does its own gas estimation and isn't guaranteed to pad enough for this specific case. Deferred (not fixed) in [[hardhat-automated-test-suite]] (ADR 0020) — flagged as an Open Question there for whether to address it (e.g. the frontend passing an explicit gas limit/buffer on `storeCid` calls, or the contract restructuring the reward path). If reward-payout complaints ever surface from real users, check this first before assuming a balance/config issue.
