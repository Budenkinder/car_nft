---
name: event-queries-must-be-chunked
description: Any getPastEvents call must be chunked into <10,000-block windows and bounded by REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK — the RPC provider hard-caps eth_getLogs ranges.
metadata:
  type: project
  scope: frontend
---

Sepolia RPC providers (Infura/Alchemy tiers) reject any `eth_getLogs` spanning more than **10,000 blocks**: `Returned error: range 11376833 exceeds limit of 10000`. This was hit for real in production testing, not theorised (ADR 0027, `docs/decisions/2026-07-29-010-backfill-sepolia-deployed-at-block.md`).

Two things are needed together — either alone is insufficient:

1. **Chunking.** `getPastEventsChunked` in `frontend/src/utils/pinata_ipfs_nft_service.js` splits any range into 9,999-block windows. Use it for every historical event read; never call `getPastEvents` with a wide range directly.
2. **A bounded `fromBlock`.** `getContractDeployBlock(chainId)` in `frontend/src/utils/contract_utils.js` reads `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` (Sepolia) / `..._LOCAL` (Hardhat), defaulting to `0`. **The `0` fallback is a trap:** chunking a full genesis-to-tip scan is ~1,138 sequential calls, which trips the provider's *rate* limit instead of its range limit. A correct-but-unusable query.

**Why:** the feature reconstructs each VIN's transaction history from past `CidStored` events rather than storing tx hashes off-chain (ADR 0027, accepted) — so event reads are on the critical path of a user-visible feature, not a background nicety.

**How to apply:** whenever adding a read over `CidStored` (or any future event — e.g. the record entries in ADR 0030), go through the chunked helper and pass `getContractDeployBlock(chainId)` as `fromBlock`. After any redeploy, `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` must be updated in **both** `frontend/.env.local` (written automatically — see [[deploy-syncs-frontend]]) and Vercel Production (manual). Current live value is `11385148`, the UUPS proxy bootstrap block — see [[vincidregistry-uups-proxy]]. The scanned range grows ~7,200 blocks/day, so chunk count creeps up over time; that is cost, not breakage.
