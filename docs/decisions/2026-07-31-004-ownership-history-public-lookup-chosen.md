---
date: 2026-07-31
scope: both
status: proposed
related_adr: 0029-ownership-history-public-lookup
supersedes: none
---

# Add a router + read-only RPC public lookup page, over a query-param view or pointing users at Etherscan

## Context

The user supplied a broad product wishlist for the VIN car-NFT. After scoping how much to plan up front (chose: full plans for every feature area now) and which feature to design first (ownership history + public lookup), this decision records the specific approach chosen for that first feature within ADR 0029.

## Decision

Add `react-router-dom` and a dedicated `/lookup/:vin` route rendered via a new read-only JSON-RPC provider (independent of `window.ethereum`), rather than a query-param view bolted onto the existing single-page `App.js`, or relying on Etherscan's own contract-read UI. Ownership history is reconstructed from the standard, already-indexed `Transfer` event — no contract change needed.

## Alternatives Considered

- Query-param view inside `App.js` — rejected as a false economy; avoids one new dependency at the cost of mixing wallet-gated and public logic in an already-535-line component, with a marketplace page also coming later needing the same routing.
- Point users at Etherscan's "Read Contract" tab — rejected; doesn't satisfy "anyone can type a VIN," requires viewers to already know Etherscan's UI.

## Consequences

- A frontend-safe RPC endpoint must be provisioned by the user before this ships (cannot reuse the private Hardhat deploy RPC key) — same category of manual step as the Vercel env var updates from ADR 0028.
- Establishes the router this project will reuse for the marketplace page (ADR 0032).
