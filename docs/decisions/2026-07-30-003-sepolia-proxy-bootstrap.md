---
date: 2026-07-30
scope: contracts
status: accepted
related_adr: 0028-vin-registry-uups-proxy
supersedes: none
---

# Bootstrapped the UUPS proxy on Sepolia

## Context

Plan 0028's contracts side was implemented and verified locally (bootstrap → register → upgrade → data survives, all tests passing). The user was asked whether to proceed with the Sepolia rollout now, given it spends real Sepolia ETH, replaces the live contract address, and — per the prior decision to accept data loss at cutover — starts the registry empty. The user confirmed: "Yes, bootstrap Sepolia now."

## Decision

Ran `FORCE_FRESH_DEPLOY=1 npm run deploy:sepolia` (the existing `deployments/sepolia.json` was from the old, pre-proxy contract, so the script's double-bootstrap guard correctly required the override flag for this deliberate architecture cutover). Result:

- `CarRewardToken`: `0x854966B53849f7fF12Bad90293E1eD2DcADc913e`
- `VinCidRegistry` implementation: `0xdE69ad20A6169bEf874488C6306361Cfd9cbE264`
- `VinCidRegistry` proxy (the address that matters going forward): `0x9e30596A7C80754cd5149A465e89758CAdB0F8B3`
- Deployed at block: `11385148`

`deployments/sepolia.json` and `docs/deployments/sepolia_contract_deploy_addresses_2026-07-30.md` were updated/written by the script. `frontend/.env.local`'s `REACT_APP_SMART_CONTRACT_ADDRESS`/`REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` were updated automatically; the matching Vercel Production env vars still need a manual update by the user (plan 0028 frontend, task 3) — outside the tools available in this session.

## Alternatives Considered

- Wait for the user to run the Sepolia deploy themselves later — not chosen; the user explicitly asked to proceed now.

## Consequences

- **Positive:** Sepolia now runs the same UUPS-proxy architecture as verified locally; future contract changes ship via `npm run upgrade:sepolia` without ever changing the registry address again.
- **Negative / accepted costs:** Whatever VINs were registered on the old (non-upgradeable) Sepolia `VinCidRegistry` are no longer listed — expected and pre-approved (`2026-07-30-001-accept-sepolia-data-loss-at-cutover.md`).
- **Follow-ups required:** User must set `REACT_APP_SMART_CONTRACT_ADDRESS=0x9e30596A7C80754cd5149A465e89758CAdB0F8B3` and `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK=11385148` in Vercel Production and redeploy `main`. The Sepolia *upgrade* path (`npm run upgrade:sepolia`) has not yet been exercised (only bootstrap) — no immediate need until the next contract change ships.
