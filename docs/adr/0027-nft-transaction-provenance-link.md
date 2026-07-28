# ADR 0027: Link each VIN's NFT record to the on-chain transaction(s) that created/updated it

- **Status:** proposed
- **Date:** 2026-07-28
- **Scope:** both
- **Related plans:**
  - `docs/plans/draft/0027-nft-transaction-provenance-link-frontend.md`
  - `docs/plans/draft/0027-nft-transaction-provenance-link-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-28-014-nft-transaction-provenance-link.md`

## Context

Today, once a VIN is registered, the only place a transaction hash is ever shown is the transient success banner right after `handleSubmit` completes (`frontend/src/App.js:472-481`, driven by local `txHash` state). It's lost on page reload and never shown again — loading an existing VIN via "Load Car NFT" or listing everything via "Show All Registered NFTs" surfaces only `{ vin, cid }`, with no link back to the transaction(s) that produced that state. The user asked whether this matters and how to fix it.

It matters because the NFT's `tokenURI`/CID is only proof of *current state* — it doesn't show provenance (when, via which transaction, how many times updated). For a vehicle repair-history record, being able to point at the actual on-chain transaction for each entry is a meaningful trust upgrade over "trust the app's UI."

The data already exists on-chain without any contract change: `storeCid` emits `CidStored(vin, cid, tokenId)` on **every** call — both the initial mint and every later update (`contracts/car_nft_sc.sol:74`, inside a code path shared by both branches). Each emission's transaction receipt carries the `transactionHash` and `blockNumber`. Querying and filtering these past events reconstructs the full history for a VIN: first event (lowest block) = the registration/mint, every subsequent one = an update.

## Decision

Reconstruct transaction provenance from on-chain event history rather than persisting tx hashes anywhere off-chain, and surface it in the UI:

- **Frontend:** add a `getTransactionHistoryForVin(vin, chainId)` read that queries past `CidStored` events, filters them (client-side, since `vin`/`tokenId` are not indexed) to the requested VIN, and returns each match's `{ cid, txHash, blockNumber }` sorted oldest→newest. Display this as a small "Transaction History" list (Etherscan-linked) wherever a VIN's record is shown: after "Load Car NFT" resolves, and after a fresh successful registration.
- **Contracts/scripts:** no Solidity change. `scripts/deploy.js` gains one addition — record the registry's deployment block number in the deploy artifact (`deployments/<network>.json`) and sync it to the frontend as a new env var, so the frontend can bound its event query with `fromBlock` instead of scanning from genesis. Already-deployed contracts (including the current live Sepolia one) won't have this value; the frontend falls back to `fromBlock: 0` for those, which is correct but slower — acceptable at POC scale on a testnet.

## Options Considered

### Option A — Reconstruct history from existing `CidStored` events, no contract change (chosen)
- **Pros:** No redeploy, no ABI/breaking change; works retroactively for every VIN ever registered, including on the already-live Sepolia contract; the displayed link is independently verifiable by anyone against the chain itself — maximizes trust.
- **Cons:** `vin`/`tokenId` aren't indexed on `CidStored`, so filtering happens client-side over every matching event in the queried block range rather than via an RPC-side topic filter — fine at this project's scale (a handful of VINs), would need revisiting if usage grew into the thousands.

### Option B — Add `indexed` to `CidStored`'s `tokenId` (or a vin hash), enabling RPC-side filtering
- **Pros:** Cheaper queries at scale (server-side topic filter instead of client-side scan-and-filter).
- **Cons:** Breaking ABI/event-signature change — requires a full redeploy (new registry address, migration of `minter`/`rewardToken`/funding, updated `deployments/*.json`, updated frontend ABI/address). Old events before the upgrade wouldn't match the new indexed topic, so a fallback scan would still be needed for pre-upgrade history anyway. Disproportionate for the current VIN volume — deferred as a future scalability path, not adopted now.

### Option C — Persist tx hashes off-chain (e.g. a small DB, or embed in the IPFS-pinned metadata JSON)
- **Pros:** Simple, fast reads, no event-log scanning at all.
- **Cons:** Directly undermines the trust goal the user asked about — an off-chain-stored tx hash is just an unverified claim; nothing stops it from being wrong, stale, or tampered with independent of the chain. Embedding it in the metadata JSON is also causally impossible for the mint's own tx hash (the CID must be pinned *before* `storeCid` is called, so the tx hash doesn't exist yet at pin time) without re-pinning after mining, which would mint a second CID that doesn't match what's actually stored on-chain. Rejected.

## Consequences

- **Positive:** Every VIN record can show a verifiable, Etherscan-linked history of exactly which transactions created and updated it — directly answers the user's trust question.
- **Negative:** Client-side event scanning has a cost (RPC calls, filtering) that grows with total event count over time; acceptable now, worth revisiting (Option B) if the registry sees heavy adoption.
- **Frontend impact:** New read function in `pinata_ipfs_nft_service.js`; new UI list in the "Load Car NFT" result view and post-registration success view; new env var consumed in `contract_utils.js`.
- **Contracts impact:** No Solidity change. `scripts/deploy.js` writes one new field; `deployments/*.json` schema gains `deployedAtBlock`.
- **Follow-ups:** If the registry ever needs efficient server-side filtering by VIN/tokenId at scale, revisit Option B as its own ADR (would be a breaking redeploy).

## References

- `contracts/car_nft_sc.sol:49-81` (`storeCid`, `CidStored` emission shared by mint and update paths).
- `frontend/src/App.js:472-481` (existing transient `txHash` success banner — the only current tx-hash surface, and it's not persisted).
- ADR 0005 (`docs/adr/0005-deploy-script-frontend-sync.md`) — precedent for `scripts/deploy.js` syncing values into `frontend/.env.local`, extended here with one more field.
