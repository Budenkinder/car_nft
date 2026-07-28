---
date: 2026-05-21
scope: both
status: accepted
related_adr: 0005-deploy-script-frontend-sync
supersedes: none
---

# deploy.js syncs the frontend (contract address + ABI) on every deploy

## Context

`scripts/deploy.js` deploys fresh contracts each run, so the registry address changes every time. It auto-writes the new address to `frontend/.env.local` only for localhost deploys; for Sepolia it just prints a Vercel hint, and it never refreshes `frontend/src/utils/contract_abi.json`. This already caused a "No contract address configured" failure when `REACT_APP_SMART_CONTRACT_ADDRESS` sat empty after a Sepolia deploy. The user asked that the address **always** propagate after `deploy:sepolia`, and chose to combine this with the ABI sync that the never-created plan 0003 had proposed.

## Decision

Extend `scripts/deploy.js` to sync the frontend on every deploy: write the new `VinCidRegistry` address into `frontend/.env.local` (`REACT_APP_SMART_CONTRACT_ADDRESS` for sepolia, `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` for localhost/hardhat) via a shared `upsertEnvVar` helper, and copy the freshly compiled `VinCidRegistry` ABI from `artifacts/` into `frontend/src/utils/contract_abi.json` on every network. The Sepolia branch still also prints the Vercel production instruction. Tracked as plan 0005; the ABI-sync scope of the never-created plan 0003 is absorbed here.

## Alternatives Considered

- **Automate the sync in deploy.js** — chosen: the only mechanism that truly guarantees "always"; deploy.js is the single chokepoint that already knows the new address.
- **Document a manual rule in CLAUDE.md** — rejected: relies on the deployer remembering; "always" is unenforceable — exactly the failure already observed.
- **A Claude Code harness hook** — rejected: a harness hook does nothing when the user runs `npm run deploy:sepolia` in their own terminal; wrong layer.

## Consequences

- **Positive:** after any deploy, local dev against that network works with no manual `.env.local` step; the ABI never drifts from the deployed contract.
- **Negative / accepted costs:** `frontend/src/utils/contract_abi.json` becomes a generated artifact (review, do not hand-edit); Sepolia deploys now write the developer-local, gitignored `.env.local`.
- **Follow-ups required:** implement per plan 0005 once approved; add a `docs/memory/contracts/` entry recording the deploy-time sync; plan 0003 will not be created (absorbed). Vercel production env vars remain a manual step.
