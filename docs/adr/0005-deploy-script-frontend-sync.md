# ADR 0005: Deploy script syncs the frontend (contract address + ABI) on every deploy

- **Status:** accepted
- **Date:** 2026-05-21
- **Scope:** both
- **Related plans:**
  - `docs/plans/done/0005-deploy-script-frontend-sync-frontend.md`
  - `docs/plans/done/0005-deploy-script-frontend-sync-contracts.md`
- **Related decisions:** `docs/decisions/2026-05-21-004-deploy-script-frontend-sync.md`

## Context

`scripts/deploy.js` deploys fresh contract instances on every run, so the registry address changes each time (`CREATE`, nonce-derived). Today the script only auto-updates the frontend for **localhost** deploys — it writes `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` into `frontend/.env.local`. For **Sepolia** it merely prints the address as a Vercel instruction and writes nothing locally. It also never refreshes `frontend/src/utils/contract_abi.json`.

This gap already cost real debugging time: after a Sepolia deploy, `REACT_APP_SMART_CONTRACT_ADDRESS` sat empty in `.env.local` and the frontend failed with "No contract address configured". The user's directive is that the new address must **always** propagate after `deploy:sepolia` — and a human-followed rule cannot guarantee "always".

The approved-but-never-created plan 0003 ("local-hardhat-redeploy-and-abi-sync") proposed the ABI-sync half of this; its `docs/` artifacts were never created. Per the user's decision, this ADR **absorbs** plan 0003's ABI-sync scope — plan 0003 will not be created separately.

## Decision

Extend `scripts/deploy.js` to fully sync the frontend on **every** deploy:

1. **Address sync** — write the new `VinCidRegistry` address into `frontend/.env.local`: `REACT_APP_SMART_CONTRACT_ADDRESS` for `sepolia`, in addition to the existing `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` for `localhost`/`hardhat`. The Sepolia branch still also prints the Vercel production instruction.
2. **ABI sync** — on every network, copy the freshly compiled `VinCidRegistry` ABI from `artifacts/contracts/car_nft_sc.sol/VinCidRegistry.json` into `frontend/src/utils/contract_abi.json`.

The env-line write is refactored into a shared `upsertEnvVar(envPath, key, value)` helper used by both the localhost and sepolia branches.

## Options Considered

### Option A — Automate the sync in deploy.js *(chosen)*
- **Pros:** the only mechanism that truly guarantees "always"; `deploy.js` is the single chokepoint that already knows the new address and runs after `compile`; consistent with the existing localhost auto-write.
- **Cons:** `contract_abi.json` becomes a generated artifact; a Sepolia deploy now writes the developer's gitignored `.env.local`.

### Option B — Document a manual rule in CLAUDE.md
- **Pros:** no code change.
- **Cons:** relies on whoever deploys remembering; "always" is unenforceable — exactly the failure already observed.

### Option C — A Claude Code harness hook
- **Pros:** fires automatically when Claude runs the deploy.
- **Cons:** a harness hook does nothing when the user runs `npm run deploy:sepolia` in their own terminal; wrong layer.

## Consequences

- **Positive:** after any deploy, local dev against that network works with no manual `.env.local` step; the ABI never silently drifts from the deployed contract.
- **Negative:** `contract_abi.json` is now generated — review it, do not hand-edit it; Sepolia deploys now touch `.env.local`.
- **Frontend impact:** no source code change. `frontend/.env.local` (gitignored) and `frontend/src/utils/contract_abi.json` (committed, now generated) are written by the deploy script.
- **Contracts impact:** `scripts/deploy.js` only — no Solidity, no ABI surface change, no `hardhat.config.js` change.
- **Follow-ups:** plan 0003 is absorbed and will not be created. Production (Vercel) env vars are still updated manually — out of scope here.

## References

- `scripts/deploy.js` — current "Frontend wiring" block (localhost-only env write).
- `frontend/src/utils/contract_utils.js` — chain-id → address map consuming the two `REACT_APP_*` vars.
- ADR 0004 — the list feature whose "No contract address configured" failure surfaced this gap.
