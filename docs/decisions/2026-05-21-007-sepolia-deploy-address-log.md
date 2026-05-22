---
date: 2026-05-21
scope: contracts
status: accepted
related_adr: 0006-sepolia-deploy-address-log
supersedes: none
---

# Sepolia deploys write a dated address log to docs/deployments/

## Context

`deployments/sepolia.json` records the deployed addresses but is a single JSON overwritten each deploy — no history, no Etherscan links, not human-friendly. The user asked that **whenever** they deploy to Sepolia, a dated Markdown file be created listing the new contract addresses with names and Etherscan links.

## Decision

Extend `scripts/deploy.js` so a `sepolia` deploy writes `docs/deployments/sepolia_contract_deploy_addresses_<YYYY-MM-DD>.md` — deploy metadata plus a table of `VinCidRegistry` and `CarRewardToken` with addresses and `https://sepolia.etherscan.io/address/<addr>` links. Filename is date-only, so a same-day re-deploy overwrites. Gated on `network === "sepolia"`; localhost/hardhat deploys produce no log. Tracked as plan 0006.

## Alternatives Considered

- **Automate in deploy.js** — chosen: the only mechanism that guarantees "whenever"; deploy.js already runs on every deploy and holds both addresses.
- **Document a manual rule in CLAUDE.md** — rejected: relies on the deployer remembering; "whenever" is unenforceable.
- **A Claude Code harness hook** — rejected: does nothing when the user runs `npm run deploy:sepolia` in their own terminal; wrong layer.
- **Time-suffixed filename (keep every deploy)** — rejected by the user in favour of a date-only filename; same-day re-deploys overwrite.
- **`docs/` root vs `docs/deployments/`** — `docs/deployments/` chosen to keep the `docs/` root uncluttered.

## Consequences

- **Positive:** every Sepolia deploy leaves a dated, readable record with clickable Etherscan links; deploy history accumulates in `docs/deployments/`.
- **Negative / accepted costs:** a second Sepolia deploy on the same day overwrites that day's log — only the latest of any day is kept; `docs/deployments/` is generated content.
- **Follow-ups required:** implement per plan 0006 once approved; add a `docs/memory/contracts/` entry recording the behaviour.
