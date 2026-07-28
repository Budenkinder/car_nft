# Plan 0006 — Sepolia deploy address log — Contracts

- **ADR:** `docs/adr/0006-sepolia-deploy-address-log.md`
- **Paired plan:** `docs/plans/done/0006-sepolia-deploy-address-log-frontend.md`
- **Status:** done
- **Date:** 2026-05-21

> Plan files live in a subfolder named after their `Status:` value. New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Extend `scripts/deploy.js` so a `sepolia` deploy writes a dated Markdown log to `docs/deployments/sepolia_contract_deploy_addresses_<YYYY-MM-DD>.md` listing the deployed contracts (`VinCidRegistry`, `CarRewardToken`) with names, addresses, and Etherscan Sepolia links, plus deploy metadata.

**Out of scope:** logs for `localhost`/`hardhat` deploys (Sepolia only); any Solidity, ABI, or `hardhat.config.js` change; a time component in the filename (date-only by user decision — same-day re-deploys overwrite).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `scripts/deploy.js` | modify | Add a `sepolia`-gated step that writes the dated deploy-log md file. |
| `docs/memory/contracts/sepolia-deploy-log.md` | add | Memory: Sepolia deploys auto-generate `docs/deployments/` logs. |
| `docs/memory/MEMORY.md` | modify | Index line for the new memory file. |
| `docs/deployments/` | (created at deploy time) | Created by `deploy.js` via `fs.mkdirSync(..., { recursive: true })` — not added in this plan. |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [x] **1.** In `scripts/deploy.js`, after the "Frontend wiring" block and gated on `network === "sepolia"`, add a "Sepolia deploy log" step: derive the date from `artifact.deployedAt.slice(0, 10)`; `fs.mkdirSync` `docs/deployments/` (resolved via `path.join(__dirname, "..", "docs", "deployments")`, `{ recursive: true }`); build the Markdown content with a template literal — an `# Sepolia Contract Deployment — <date>` heading, a metadata list (network, chainId from `artifact.chainId`, deployer, `deployedAt`), and a table with one row per contract (`VinCidRegistry` = `registryAddress`, `CarRewardToken` = `rewardTokenAddress`), each row showing the address and an Etherscan markdown link `https://sepolia.etherscan.io/address/<addr>`; `fs.writeFileSync` it to `sepolia_contract_deploy_addresses_<date>.md`; `console.log` the path.
- [x] **2.** Create `docs/memory/contracts/sepolia-deploy-log.md` and add its index line to `docs/memory/MEMORY.md`.

## Contract Surface

- No functions, events, storage, access control, or gas behaviour change. `contracts/` is untouched.

## Interfaces with Frontend

- None. The log file is documentation under `docs/`; the frontend reads nothing from it.

## Testing

- **Sepolia:** `npm run deploy:sepolia` → `docs/deployments/sepolia_contract_deploy_addresses_<today>.md` exists, lists both contracts with correct addresses, and the Etherscan links resolve.
- **Localhost (negative):** `npm run deploy:local` → **no** file is created under `docs/deployments/` (step is gated on `sepolia`).
- **Same-day overwrite:** a second `deploy:sepolia` the same day overwrites the file with the newer addresses.
- `node --check scripts/deploy.js` passes.

## Deployment and Migration

- No on-chain migration. Tooling-only change; takes effect on the next `deploy:sepolia`.

## Risks and Rollback

- **Risk:** same-day re-deploy overwrites the earlier log — accepted (date-only filename, user decision).
- **Rollback:** revert the `scripts/deploy.js` change; existing log files under `docs/deployments/` can be kept or deleted independently.

## Open Questions

- None. Location (`docs/deployments/`) and same-day behaviour (date-only, overwrite) confirmed with the user.
