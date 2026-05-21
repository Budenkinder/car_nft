---
date: 2026-05-21
scope: frontend
status: accepted
related_adr: 0004-frontend-list-all-registered-nfts
supersedes: none
---

# List all registered NFTs in the frontend: button + VIN→CID pairs + IPFS links

## Context

The `VinCidRegistry` already exposes `getAllVins()` and `getAllCidsAsList()`, and both are in the frontend ABI, but the UI never calls them — there is no way to see every registered NFT. The user asked for the frontend to call the registry's list function and render the results as a list. Three design points needed deciding: what each row shows, how the list is triggered, and how a CID is displayed.

## Decision

Add an "All Registered Car NFTs" section to `App.js`. A new `getAllRegisteredNfts(chainId)` function in `pinata_ipfs_nft_service.js` calls `getAllVins()` and `getAllCidsAsList()` in parallel and zips them by index into `{ vin, cid }` rows. The list loads only when the user clicks a dedicated "Show all registered NFTs" button, and each CID renders as a clickable link to `https://gateway.pinata.cloud/ipfs/<cid>`.

## Alternatives Considered

- **Dedicated button + VIN→CID pairs + clickable IPFS links** — chosen: self-identifying rows, explorable CIDs, no RPC call until requested.
- **`getAllCidsAsList()` only, CIDs as plain text** — rejected: rows are opaque hashes with no VIN context and nothing to click.
- **Auto-load on wallet connect** — rejected: forces an unbounded `view` call every session even when the list is not wanted.

## Consequences

- **Positive:** Full registry view in the UI; the existing `getAllVins`/`getAllCidsAsList` contract surface is finally used; change is purely additive.
- **Negative / accepted costs:** Two `view` calls per click instead of one; the calls are unpaginated, so a very large registry could be slow or hit RPC limits — accepted at current testnet scale.
- **Follow-ups required:** Implement per the frontend plan once approved; add a `docs/memory/frontend/` entry for the web3.js-not-ethers service-layer convention; revisit pagination if the registry grows large (tracked in ADR 0004).
