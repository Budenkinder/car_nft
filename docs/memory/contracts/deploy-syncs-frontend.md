---
name: deploy-syncs-frontend
description: scripts/deploy.js auto-writes the frontend contract address and ABI on every deploy
metadata:
  type: project
  scope: contracts
---

`scripts/deploy.js` syncs the frontend on **every** deploy (per ADR 0005):

- **Address** — upserts the new `VinCidRegistry` address into `frontend/.env.local` via the `upsertEnvVar` helper: key `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` for `localhost`/`hardhat`, key `REACT_APP_SMART_CONTRACT_ADDRESS` for `sepolia`. The Sepolia branch also prints the Vercel production instruction (Vercel env vars are still set manually).
- **ABI** — copies the freshly compiled ABI from `artifacts/contracts/car_nft_sc.sol/VinCidRegistry.json` into `frontend/src/utils/contract_abi.json` on every network. The script aborts with a non-zero exit if that artifact is missing (run `npm run compile` first).

**Why:** the deploy creates fresh contract addresses every run; a human-followed "remember to update the address" rule failed in practice (the frontend hit "No contract address configured" after a Sepolia deploy with an empty `REACT_APP_SMART_CONTRACT_ADDRESS`). The deploy script is the single chokepoint that always knows the new address and ABI.

**How to apply:** treat `frontend/src/utils/contract_abi.json` as a **generated artifact** — do not hand-edit it; change the contract and re-deploy (or re-compile + re-deploy) instead. After any deploy, restart the React dev server so `.env.local` is re-read. For production, set `REACT_APP_SMART_CONTRACT_ADDRESS` in Vercel manually. Frontend-side contract access still goes through the service layer — see [[web3js-contract-access-pattern]].
