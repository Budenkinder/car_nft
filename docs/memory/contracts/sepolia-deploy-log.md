---
name: sepolia-deploy-log
description: Every Sepolia deploy auto-writes a dated address-log md file to docs/deployments/
metadata:
  type: project
  scope: contracts
---

`scripts/deploy.js` writes a dated Markdown deploy log on every **Sepolia** deploy (per ADR 0006): `docs/deployments/sepolia_contract_deploy_addresses_<YYYY-MM-DD>.md`. The file holds the deploy metadata (network, chainId, deployer, timestamp) and a table of `VinCidRegistry` and `CarRewardToken` with their addresses rendered as Etherscan Sepolia links (`https://sepolia.etherscan.io/address/<addr>`). The step is gated on `network === "sepolia"` — `localhost`/`hardhat` deploys write no log.

**Why:** `deployments/sepolia.json` is machine-readable and overwritten every deploy, so it keeps no history; the user wanted a durable, human-readable, Etherscan-linked record of each Sepolia deployment.

**How to apply:** treat files under `docs/deployments/` as **generated** — they are deploy output, not hand-authored docs. The filename is date-only, so a second Sepolia deploy on the same calendar day overwrites that day's file (only the latest of any day is kept). This is separate from, and complements, the frontend address/ABI sync — see [[deploy-syncs-frontend]].
