# Memory Index

This is the index of all repo-tracked memory. Every memory file under `docs/memory/frontend/` or `docs/memory/contracts/` must have a one-line entry here.

**Memory location is fixed:** project memory lives only under `docs/memory/`. Never write to `.claude/` or `~/.claude/`.

Format: `- [Title](relative/path.md) — one-line hook`

> Do not write memory content in this file. This file is an index only.
> Keep this file under ~200 lines; if it grows past that, the index is being misused.

## Frontend (`docs/memory/frontend/`)

- [Plans live in status-named subfolders](frontend/plan-status-folders.md) — draft/approved/in-progress/done/rejected; both plans in a trio move together when status changes (per ADR 0002).
- [Approved plans get a GitHub issue](frontend/github-issue-on-plan-approval.md) — user rule 2026-08-01: entering `approved/` files an issue in Budenkinder/car_nft, linked from both plan files; closed on done/rejected (ADR 0034).
- [Contract access uses web3.js + a service layer](frontend/web3js-contract-access-pattern.md) — frontend uses web3.js not ethers; all reads/writes funnel through pinata_ipfs_nft_service.js.
- [Pinata: only the JWT is a real credential](frontend/pinata-jwt-only-credential.md) — REACT_APP_PINATA_JWT is the only Pinata secret read anywhere in the codebase; API Key/Secret have no reader.

## Contracts (`docs/memory/contracts/`)

- [Hardhat 3 + ESM migration](contracts/hardhat-3-esm-migration.md) — project runs Hardhat 3/ESM; use `hardhat-toolbox-mocha-ethers` (never plain `hardhat-toolbox`, it's a dead shim); config/scripts use `defineConfig`/`network.create()`/`configVariable`.
- [deploy.js auto-syncs the frontend](contracts/deploy-syncs-frontend.md) — every deploy writes the contract address to `.env.local` and the ABI to `contract_abi.json`; treat `contract_abi.json` as generated.
- [Sepolia deploys write a dated address log](contracts/sepolia-deploy-log.md) — every Sepolia deploy generates `docs/deployments/sepolia_contract_deploy_addresses_<date>.md`; treat `docs/deployments/` as generated.
- [Local Hardhat node persistence approach](contracts/hardhat-node-persistence-approach.md) — node runs as a detached background process (postStartCommand) to survive terminal restarts; not disk-persisted, not Anvil.
- [Automated Hardhat test suite](contracts/hardhat-automated-test-suite.md) — `network.create()` + `loadFixture`, not the persistent node; `npm test` / `npm run test:report`; report at docs/testing/automated-test-report.md.
- [Reward payout gas-estimation risk](contracts/reward-payout-gas-estimation-risk.md) — storeCid's CRT reward can silently not pay out under default gas estimation, even fully funded; real production risk, not fixed.
- [VinCidRegistry is now a UUPS proxy](contracts/vincidregistry-uups-proxy.md) — bootstrap via `deploy.js`, all later changes via `scripts/upgrade.js`; registry address stable, data survives upgrades (ADR 0028). Live on Sepolia and Vercel, verified end-to-end.
- [Fresh containers get no `.env` files](contracts/fresh-container-env-files-not-scaffolded.md) — nothing scaffolds `.env`/`frontend/.env.local` on a rebuild; Hardhat drops the sepolia network silently. Fix (plan 0013) approved but unstarted; rejected and un-rejected on 2026-08-02.
- [Product roadmap: ADRs 0029-0033 (draft)](contracts/product-roadmap-0029-0033.md) — 5 draft trios from a 2026-07-31 wishlist: ownership history/public lookup, structured vehicle record, simple transfer, escrow/marketplace, notifications. None approved/implemented yet.
