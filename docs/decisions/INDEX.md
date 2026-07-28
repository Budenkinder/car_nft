# Decision Log Index

One line per decision file under `docs/decisions/`. Newest first.

Format: `- YYYY-MM-DD — [Title](YYYY-MM-DD-NNN-slug.md) — scope: <frontend|contracts|both> — status: <proposed|accepted|superseded>`

- 2026-07-28 — [Plan 0022 transitioned draft → in-progress and completed](2026-07-28-007-plan-0022-draft-to-in-progress.md) — scope: frontend — status: accepted
- 2026-07-28 — [Add a write-flow step documenting the compensating unpin, instead of redrawing the architecture diagram](2026-07-28-006-document-compensating-unpin-in-readme.md) — scope: frontend — status: accepted
- 2026-07-28 — [Plan 0020 implementation: two findings beyond the original task list](2026-07-28-005-plan-0020-implementation-findings.md) — scope: contracts — status: accepted
- 2026-07-28 — [Plan 0020 transitioned draft → in-progress](2026-07-28-004-plan-0020-draft-to-in-progress.md) — scope: contracts — status: accepted
- 2026-07-28 — [Gate `main`'s Vercel production deploy on `npm test` via GitHub Actions + a Deploy Hook, not a Vercel build-command override](2026-07-28-003-gate-vercel-deploy-on-contract-tests.md) — scope: both — status: accepted
- 2026-07-28 — [Use Hardhat's native Mocha/ethers runner for automated contract tests; do not combine with plan 0019](2026-07-28-002-automated-hardhat-test-suite.md) — scope: contracts — status: accepted
- 2026-07-28 — [Run the local Hardhat node as a container-lifecycle background process, not via Foundry Anvil disk persistence](2026-07-28-001-persistent-local-hardhat-node.md) — scope: contracts — status: accepted

> Do not write decision content in this file. This file is an index only.
> Every new file in `docs/decisions/` must be added here in the same change.

## Entries

- 2026-07-26 — [Compensating unpin when on-chain mint fails after a successful IPFS pin](2026-07-26-011-unpin-ipfs-on-mint-failure.md) — scope: frontend — status: accepted
- 2026-07-26 — [Plan 0017 transitioned in-progress → done](2026-07-26-010-plan-0017-in-progress-to-done.md) — scope: both — status: accepted
- 2026-07-26 — [Plan 0017 transitioned draft → in-progress](2026-07-26-009-plan-0017-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-07-26 — [Commit generated README.md PDF export under docs/](2026-07-26-008-readme-pdf-export.md) — scope: both — status: accepted
- 2026-07-26 — [Plan 0016 transitioned in-progress → done](2026-07-26-007-plan-0016-in-progress-to-done.md) — scope: both — status: accepted
- 2026-07-26 — [Plan 0016 transitioned draft → in-progress](2026-07-26-006-plan-0016-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-07-26 — [Document Hardhat ETH-vs-NFT visibility in README](2026-07-26-005-readme-hardhat-nft-visibility.md) — scope: both — status: accepted
- 2026-07-26 — [Plan 0015 transitioned in-progress → done](2026-07-26-004-plan-0015-in-progress-to-done.md) — scope: both — status: accepted
- 2026-07-26 — [Plan 0015 transitioned draft → in-progress](2026-07-26-003-plan-0015-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-07-26 — [Add Sepolia NFT-mint test case doc under docs/testing/](2026-07-26-002-sepolia-nft-mint-test-case-doc.md) — scope: both — status: accepted
- 2026-07-26 — [Rotate Pinata IPFS credentials](2026-07-26-001-rotate-pinata-credentials.md) — scope: frontend — status: accepted
- 2026-07-23 — [Plan 0013 transitioned draft → approved](2026-07-23-002-plan-0013-draft-to-approved.md) — scope: both — status: accepted
- 2026-07-23 — [Scaffold `.env` / `frontend/.env.local` on Dev Container creation instead of leaving them unhandled](2026-07-23-001-devcontainer-env-scaffolding.md) — scope: both — status: proposed
- 2026-07-20 — [Plan 0012 transitioned in-progress → done; ADR 0012 bumped proposed → accepted](2026-07-20-004-plan-0012-in-progress-to-done.md) — scope: both — status: accepted
- 2026-07-20 — [Plan 0012 transitioned draft → in-progress](2026-07-20-003-plan-0012-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-07-20 — [Plan 0011 transitioned in-progress → done; ADR 0011 bumped proposed → accepted](2026-07-20-002-plan-0011-in-progress-to-done.md) — scope: both — status: accepted
- 2026-07-20 — [Plan 0011 transitioned draft → in-progress](2026-07-20-001-plan-0011-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-07-19 — [Correct the diagnosis: "No contracts to compile" is normal Hardhat 3 behavior, not a cache bug](2026-07-19-008-correct-no-contracts-to-compile-diagnosis.md) — scope: contracts — status: accepted
- 2026-07-19 — [Fix "No contracts to compile" by clearing the stale cross-version Hardhat cache](2026-07-19-007-stale-hardhat-cache-no-contracts-to-compile.md) — scope: contracts — status: superseded
- 2026-07-19 — [Plan 0008 transitioned in-progress → done; ADR 0008 bumped proposed → accepted](2026-07-19-006-plan-0008-in-progress-to-done.md) — scope: both — status: accepted
- 2026-07-19 — [Plan 0008 transitioned draft → in-progress](2026-07-19-005-plan-0008-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-07-19 — [Gitignore the types/ directory generated by hardhat-typechain](2026-07-19-004-gitignore-typechain-types-dir.md) — scope: contracts — status: accepted
- 2026-07-19 — [Plan 0007 transitioned in-progress → done; ADR 0007 bumped proposed → accepted](2026-07-19-003-plan-0007-in-progress-to-done.md) — scope: contracts — status: accepted
- 2026-07-19 — [Plan 0007 transitioned draft → in-progress](2026-07-19-002-plan-0007-draft-to-in-progress.md) — scope: contracts — status: accepted
- 2026-07-19 — [Migrate forward to Hardhat 3 + ESM rather than reverting to Hardhat 2](2026-07-19-001-hardhat-3-esm-migration.md) — scope: contracts — status: accepted
- 2026-05-21 — [Plan 0006 transitioned in-progress → done; ADR 0006 bumped proposed → accepted](2026-05-21-009-plan-0006-in-progress-to-done.md) — scope: contracts — status: accepted
- 2026-05-21 — [Plan 0006 transitioned draft → in-progress](2026-05-21-008-plan-0006-draft-to-in-progress.md) — scope: contracts — status: accepted
- 2026-05-21 — [Sepolia deploys write a dated address log to docs/deployments/](2026-05-21-007-sepolia-deploy-address-log.md) — scope: contracts — status: proposed
- 2026-05-21 — [Plan 0005 transitioned in-progress → done; ADR 0005 bumped proposed → accepted](2026-05-21-006-plan-0005-in-progress-to-done.md) — scope: both — status: accepted
- 2026-05-21 — [Plan 0005 transitioned draft → in-progress](2026-05-21-005-plan-0005-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-05-21 — [deploy.js syncs the frontend (contract address + ABI) on every deploy](2026-05-21-004-deploy-script-frontend-sync.md) — scope: both — status: accepted
- 2026-05-21 — [Plan 0004 transitioned in-progress → done; ADR 0004 bumped proposed → accepted](2026-05-21-003-plan-0004-in-progress-to-done.md) — scope: frontend — status: accepted
- 2026-05-21 — [Plan 0004 transitioned draft → in-progress](2026-05-21-002-plan-0004-draft-to-in-progress.md) — scope: frontend — status: accepted
- 2026-05-21 — [List all registered NFTs in the frontend: button + VIN→CID pairs + IPFS links](2026-05-21-001-frontend-list-all-registered-nfts.md) — scope: frontend — status: accepted
- 2026-05-19 — [Plan 0001 transitioned in-progress → done; ADR 0001 bumped proposed → accepted](2026-05-19-004-plan-0001-in-progress-to-done.md) — scope: frontend — status: accepted
- 2026-05-19 — [Plan 0001 transitioned draft → in-progress](2026-05-19-003-plan-0001-draft-to-in-progress.md) — scope: frontend — status: accepted
- 2026-05-19 — [Plan files segregated by status into subfolders; add `rejected` status](2026-05-19-002-plan-status-folders.md) — scope: both — status: accepted
- 2026-05-19 — [Theme mode toggle: context + localStorage + AppBar IconButton](2026-05-19-001-frontend-theme-mode-toggle.md) — scope: frontend — status: accepted
