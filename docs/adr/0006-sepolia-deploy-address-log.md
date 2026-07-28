# ADR 0006: Sepolia deploys write a dated address log to docs/deployments/

- **Status:** accepted
- **Date:** 2026-05-21
- **Scope:** contracts
- **Related plans:**
  - `docs/plans/done/0006-sepolia-deploy-address-log-frontend.md`
  - `docs/plans/done/0006-sepolia-deploy-address-log-contracts.md`
- **Related decisions:** `docs/decisions/2026-05-21-007-sepolia-deploy-address-log.md`

## Context

`deployments/sepolia.json` already records the deployed addresses, but it is a single JSON file overwritten on every deploy — no history, no Etherscan links, not a human-friendly artifact. The user wants a durable, readable record: **whenever** they deploy to Sepolia, a dated Markdown file should be created listing the new contract addresses with their names and Etherscan links.

As with ADR 0005, "whenever" cannot be guaranteed by a human-followed rule, and a Claude Code harness hook does not fire when the user runs `npm run deploy:sepolia` in their own terminal. `scripts/deploy.js` is the single chokepoint that always runs on a Sepolia deploy and already knows both addresses.

## Decision

Extend `scripts/deploy.js` so that, on a `sepolia` deploy, it writes `docs/deployments/sepolia_contract_deploy_addresses_<YYYY-MM-DD>.md`. The file contains the deploy metadata (network, chainId, deployer, timestamp) and a table of the two deployed contracts — `VinCidRegistry` and `CarRewardToken` — each with its address and an Etherscan Sepolia link (`https://sepolia.etherscan.io/address/<addr>`). The filename is date-only, so a second deploy on the same day overwrites the first. The step is gated on `network === "sepolia"`; localhost/hardhat deploys do not produce a log.

## Options Considered

### Option A — Automate in deploy.js *(chosen)*
- **Pros:** the only mechanism that truly guarantees "whenever"; `deploy.js` already runs on every deploy and holds both addresses; consistent with the ADR 0005 auto-sync.
- **Cons:** `docs/deployments/` becomes a generated-content folder; same-day re-deploys overwrite (chosen trade-off — see below).

### Option B — Document a manual rule in CLAUDE.md
- **Pros:** no code change.
- **Cons:** relies on the deployer remembering; "whenever" is unenforceable.

### Option C — A Claude Code harness hook
- **Pros:** fires when Claude runs the deploy.
- **Cons:** does nothing when the user runs `npm run deploy:sepolia` themselves; wrong layer.

## Consequences

- **Positive:** every Sepolia deployment leaves a dated, human-readable record with clickable Etherscan links; deploy history accumulates in `docs/deployments/`.
- **Negative:** a second Sepolia deploy on the same calendar day overwrites that day's log — only the day's latest is kept. Accepted by the user (date-only filename chosen over a time suffix).
- **Frontend impact:** none.
- **Contracts impact:** `scripts/deploy.js` only — no Solidity, ABI, or `hardhat.config.js` change.
- **Follow-ups:** none. If per-deploy history (not per-day) is later wanted, switch the filename to include a time component.

## References

- ADR 0005 — the deploy-script frontend sync this builds alongside.
- `deployments/sepolia.json` — the existing single-file address record this complements.
