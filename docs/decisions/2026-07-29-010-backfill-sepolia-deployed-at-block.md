---
date: 2026-07-29
scope: both
status: accepted
related_adr: 0027-nft-transaction-provenance-link
supersedes: none
---

## Context

After implementing plan 0027, the user hit a real error testing against the live Sepolia deployment: `getTransactionHistoryForVin:failed { ... error: 'Returned error: range 11376833 exceeds limit of 10000' }`. Root cause: the live Sepolia `VinCidRegistry` (`0x089711b304ad2E279843588F7051AFe59797CdB8`) predates the `deployedAtBlock` field this plan introduces, so `getContractDeployBlock` fell back to `0`. Scanning `CidStored` events from block `0` to the current tip (~11,376,880) exceeds the RPC provider's `eth_getLogs` range cap (10,000 blocks — a common Infura/Alchemy free-tier limit), exactly as ADR 0027's Option A "Cons" and the frontend plan's Risks section anticipated, but sooner and harder than expected — Sepolia's block height is already in the millions.

Two things were verified live against the real chain before deciding how to fix this:
1. Chunking the query into 10,000-block windows alone is not sufficient: a full 0-to-tip scan requires ~1,138 sequential `eth_getLogs` calls, which failed with a bare `Returned error:` (no detail) partway through — almost certainly the RPC provider's rate limit, not the range limit, kicking in.
2. The registry's actual deployment block can be found without a redeploy: binary-searching `eth_getCode` at the registry address (since code only exists from the deployment block onward) found block `11371335` in ~24 RPC calls. Querying `CidStored` from that block (a ~5,500-block range, well under the cap) succeeded in ~161ms and returned the exact VIN (`WBADT33383G473810`, block `11376833`) the user's error referenced — confirming this is the correct, real deployment block, not a guess.

## Decision

Two changes, both already implemented:

1. **Chunk `getTransactionHistoryForVin`'s event query** (`frontend/src/utils/pinata_ipfs_nft_service.js`) into windows of 9,999 blocks via a new `getPastEventsChunked` helper, so it never sends a single `eth_getLogs` call wider than the common provider cap — this is a permanent correctness fix, not specific to Sepolia's current state, since `latest - deployedAtBlock` will keep growing every day and would otherwise exceed 10,000 again in about 1.4 days even with a tight `deployedAtBlock`.
2. **Backfill `deployedAtBlock: 11371335`** for the live Sepolia deployment: added to `deployments/sepolia.json`, `docs/deployments/sepolia_contract_deploy_addresses_2026-07-28.md`, and `frontend/.env.local`'s `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK`. This is necessary in addition to chunking, since chunking alone still means ~1,138 sequential requests from block 0 — impractical and likely to hit provider rate limits regardless of per-request range validity.

**Action required from the user:** set `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK=11371335` in Vercel's Production environment variables (mirroring how `REACT_APP_SMART_CONTRACT_ADDRESS` is already set there) and trigger a redeploy, since the local `.env.local` fix does not reach the deployed site on its own.

## Alternatives considered

- **Redeploy `VinCidRegistry` to Sepolia now**, so the fresh deployment has `deployedAtBlock` recorded natively — rejected: a redeploy creates a new contract address, orphaning every VIN already registered against the current live contract (their NFTs, CIDs, and reward history would no longer be reachable through the app). Far more disruptive than backfilling a read-only block number for the existing contract.
- **Rely on chunking alone, keep `fromBlock: 0` fallback** — rejected per the verified rate-limit failure above; 1,138 sequential requests is not a viable request pattern regardless of per-request correctness.
- **Cap the scan to only recent N blocks, skip older history** — rejected: defeats the purpose of the feature (reconstructing full provenance), and this app has few enough VINs that skipping data isn't necessary once the range is tightened correctly.

## Consequences

- `getTransactionHistoryForVin` is now robust to large `fromBlock`-to-tip ranges on any network, not just Sepolia's current state.
- The live Sepolia deployment's history reconstruction works again immediately once the user sets the Vercel env var and redeploys.
- **Follow-up still open, not addressed here:** `deployedAtBlock` is fixed at `11371335` forever for this contract; the query range will grow ~7,200 blocks/day and will itself need occasional chunking (already handled) — no further action needed unless RPC provider rate limits become an issue again at a much larger multi-chunk scale, at which point ADR 0027's Option B (indexed event fields, requires a breaking redeploy) would be the next escalation.
