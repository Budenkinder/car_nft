# Decision Log Index

One line per decision file under `docs/decisions/`. Newest first.

Format: `- YYYY-MM-DD — [Title](YYYY-MM-DD-NNN-slug.md) — scope: <frontend|contracts|both> — status: <proposed|accepted|superseded>`

- 2026-08-04 — [Fixed a BigInt sort crash in `getOrgRoleHolders`, found during manual verification](2026-08-04-006-fix-bigint-sort-crash-in-org-role-holders.md) — scope: frontend — status: accepted
- 2026-08-04 — [ADR 0030's plan trio moved to `rejected/`; issue #36 closure blocked on `gh` token permissions](2026-08-04-005-adr-0030-plan-trio-rejected.md) — scope: both — status: accepted
- 2026-08-04 — [Plan 0035 transitioned approved → in-progress; autonomous implementation begins](2026-08-04-004-plan-0035-approved-to-in-progress.md) — scope: both — status: accepted
- 2026-08-04 — [Plan 0035 transitioned draft → approved; issue #43 filed](2026-08-04-003-plan-0035-draft-to-approved.md) — scope: both — status: accepted
- 2026-08-04 — [Role grants get a dedicated terminal script; the frontend's org-wallet list is reconstructed from events, not `AccessControlEnumerableUpgradeable`](2026-08-04-002-terminal-role-script-and-event-based-org-list.md) — scope: both — status: accepted
- 2026-08-04 — [The contract deployer EOA holds `DEFAULT_ADMIN_ROLE` and `owner()`; the 2-of-3 Gnosis Safe is dropped from ADR 0035](2026-08-04-001-deployer-eoa-replaces-safe-as-admin.md) — scope: contracts — status: accepted
- 2026-08-03 — [The CRT pay-to-read economy is split into ADR 0036; ADR 0035 leaves rewards untouched](2026-08-03-005-defer-token-economy-to-adr-0036.md) — scope: both — status: accepted
- 2026-08-03 — [ADR 0030's access-control half is absorbed into ADR 0035; its plan trio is rejected on 0035's approval](2026-08-03-004-merge-adr-0030-access-control-into-0035.md) — scope: both — status: accepted
- 2026-08-03 — [A 2-of-3 Gnosis Safe holds `DEFAULT_ADMIN_ROLE` and `owner()`, replacing the single deployer EOA](2026-08-03-003-two-of-three-safe-as-admin.md) — scope: contracts — status: superseded (by [2026-08-04-001](2026-08-04-001-deployer-eoa-replaces-safe-as-admin.md))
- 2026-08-03 — [KYB documents never touch IPFS or the chain; only the wallet address and its role go on-chain](2026-08-03-002-kyb-documents-stay-off-chain.md) — scope: both — status: accepted
- 2026-08-03 — [Organization applications are collected in the browser and submitted by email — no backend, no queue](2026-08-03-001-org-application-intake-by-email.md) — scope: frontend — status: accepted
- 2026-08-02 — [Plan 0027 transitioned in-progress → done; ADR 0027 bumped proposed → accepted; issue #42 closed](2026-08-02-008-plan-0027-in-progress-to-done.md) — scope: both — status: accepted
- 2026-08-02 — [Rejection of plan 0013 reverted; trio returned to `approved/` and issue #41 reopened](2026-08-02-007-plan-0013-rejected-back-to-approved.md) — scope: both — status: accepted
- 2026-08-02 — [Plan 0013 (Dev Container `.env` scaffolding) rejected; issue #41 closed as not planned](2026-08-02-006-plan-0013-approved-to-rejected.md) — scope: both — status: superseded (by [2026-08-02-007](2026-08-02-007-plan-0013-rejected-back-to-approved.md))
- 2026-08-02 — [Plan 0034 transitioned in-progress → done; ADR 0034 bumped proposed → accepted; issue #40 closed](2026-08-02-005-plan-0034-in-progress-to-done.md) — scope: both — status: accepted
- 2026-08-02 — [Also backfill a tracking issue (#42) for the in-progress trio 0027](2026-08-02-004-backfill-issue-for-in-progress-plan-0027.md) — scope: both — status: accepted
- 2026-08-02 — [Backfill a GitHub tracking issue (#41) for the pre-existing approved trio 0013](2026-08-02-003-backfill-issue-for-approved-plan-0013.md) — scope: both — status: accepted
- 2026-08-02 — [Plan 0034 transitioned approved → in-progress; implementation runs straight through](2026-08-02-002-plan-0034-approved-to-in-progress.md) — scope: both — status: accepted
- 2026-08-02 — [Plan 0034 transitioned draft → approved; issue #40 filed as the new rule's first application](2026-08-02-001-plan-0034-draft-to-approved.md) — scope: both — status: accepted
- 2026-08-01 — [Trigger GitHub issue creation on entry to `approved/`, not at draft time or at implementation start](2026-08-01-001-github-issue-on-plan-approval.md) — scope: both — status: accepted
- 2026-07-31 — [Link plan trios 0029–0033 to their GitHub tracking issues (#35–#39), and add the field to the plan templates](2026-07-31-009-link-plans-to-github-issues.md) — scope: both — status: accepted
- 2026-07-31 — [Ship in-app, client-computed notifications with no new backend, deferring real push/email to a future ADR](2026-07-31-008-notifications-in-app-chosen.md) — scope: both — status: proposed
- 2026-07-31 — [Standalone, non-upgradeable `CarSaleEscrow` with pull-payment, over building marketplace logic into `VinCidRegistry` or pushing payment directly to the seller](2026-07-31-007-escrow-marketplace-chosen.md) — scope: both — status: proposed
- 2026-07-31 — [Call the existing inherited ERC-721 `safeTransferFrom` directly, rather than adding a custom wrapper function](2026-07-31-006-simple-transfer-flow-chosen.md) — scope: both — status: proposed
- 2026-07-31 — [Adopt an append-only typed vehicle-record array with a separate verifier role, over relying on event reconstruction alone](2026-07-31-005-vehicle-record-entries-chosen.md) — scope: both — status: proposed
- 2026-07-31 — [Add a router + read-only RPC public lookup page, over a query-param view or pointing users at Etherscan](2026-07-31-004-ownership-history-public-lookup-chosen.md) — scope: both — status: proposed
- 2026-07-31 — [Defer exercising `npm run upgrade:sepolia` until a real contract change ships](2026-07-31-003-defer-sepolia-upgrade-test.md) — scope: contracts — status: accepted
- 2026-07-31 — [End-to-end verification: Vercel Production against the proxy-backed Sepolia registry works](2026-07-31-002-sepolia-vercel-verification-confirmed.md) — scope: both — status: accepted
- 2026-07-31 — [Plan 0028 transitioned in-progress → done; ADR 0028 bumped proposed → accepted](2026-07-31-001-plan-0028-in-progress-to-done.md) — scope: both — status: accepted
- 2026-07-30 — [Bootstrapped the UUPS proxy on Sepolia](2026-07-30-003-sepolia-proxy-bootstrap.md) — scope: contracts — status: accepted
- 2026-07-30 — [Plan 0028 transitioned draft → in-progress; autonomous implementation begins](2026-07-30-002-plan-0028-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-07-30 — [Accept the current live Sepolia registry's data as a one-time loss at proxy cutover](2026-07-30-001-accept-sepolia-data-loss-at-cutover.md) — scope: contracts — status: accepted
- 2026-07-29 — [Adopt UUPS proxy (manual `ERC1967Proxy`, no `hardhat-upgrades` plugin) over Transparent proxy or a migration script](2026-07-29-012-vin-registry-uups-proxy-chosen.md) — scope: both — status: proposed
- 2026-07-29 — [Plan 0027's manual browser verification deferred to after dev → main merge](2026-07-29-011-plan-0027-manual-test-deferred-to-post-merge.md) — scope: both — status: superseded (by [2026-08-02-008](2026-08-02-008-plan-0027-in-progress-to-done.md))
- 2026-07-29 — [Backfill Sepolia's `deployedAtBlock` via `eth_getCode` binary search, and chunk event-log queries to stay under RPC range/rate limits](2026-07-29-010-backfill-sepolia-deployed-at-block.md) — scope: both — status: accepted
- 2026-07-29 — [Plan 0027 transitioned draft → in-progress](2026-07-29-009-plan-0027-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-07-29 — [Plan 0026 transitioned in-progress → done; ADR 0026 bumped proposed → accepted](2026-07-29-008-plan-0026-in-progress-to-done.md) — scope: frontend — status: accepted
- 2026-07-29 — [Plan 0026 transitioned draft → in-progress](2026-07-29-007-plan-0026-draft-to-in-progress.md) — scope: frontend — status: accepted
- 2026-07-29 — [Plan 0025 transitioned in-progress → done](2026-07-29-006-plan-0025-in-progress-to-done.md) — scope: frontend — status: accepted
- 2026-07-29 — [Plan 0024 transitioned in-progress → done](2026-07-29-005-plan-0024-in-progress-to-done.md) — scope: frontend — status: accepted
- 2026-07-29 — [Plan 0022 transitioned in-progress → done](2026-07-29-004-plan-0022-in-progress-to-done.md) — scope: frontend — status: accepted
- 2026-07-29 — [Plan 0023 transitioned in-progress → done](2026-07-29-003-plan-0023-in-progress-to-done.md) — scope: frontend — status: accepted
- 2026-07-29 — [Plan 0020 transitioned in-progress → done](2026-07-29-002-plan-0020-in-progress-to-done.md) — scope: contracts — status: accepted
- 2026-07-29 — [Plan 0018 transitioned in-progress → done](2026-07-29-001-plan-0018-in-progress-to-done.md) — scope: frontend — status: accepted
- 2026-07-28 — [Reconstruct per-VIN transaction provenance from existing `CidStored` events, not off-chain storage](2026-07-28-014-nft-transaction-provenance-link.md) — scope: both — status: proposed
- 2026-07-28 — [Clear "Create or Update" form fields after a successful new-VIN registration, not after updates](2026-07-28-013-clear-form-after-successful-registration.md) — scope: frontend — status: proposed
- 2026-07-28 — [README's "Using the app" step synced to the current recipient field label](2026-07-28-012-readme-stale-recipient-label.md) — scope: frontend — status: accepted
- 2026-07-28 — [Plan 0024 transitioned draft → in-progress and executed](2026-07-28-011-plan-0024-draft-to-in-progress.md) — scope: both — status: accepted
- 2026-07-28 — [Document CRT MetaMask manual-import requirement, and fix stale Sepolia reference addresses in the same section](2026-07-28-010-readme-crt-metamask-import.md) — scope: both — status: accepted
- 2026-07-28 — [Plan 0023 transitioned draft → in-progress and executed](2026-07-28-009-plan-0023-draft-to-in-progress.md) — scope: frontend — status: accepted
- 2026-07-28 — [Relabel recipient field to "TÜV Car Inspection Wallet Address (recipient)"](2026-07-28-008-recipient-field-label-tuv.md) — scope: frontend — status: accepted
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
- 2026-07-23 — [Plan 0013 transitioned draft → approved](2026-07-23-002-plan-0013-draft-to-approved.md) — scope: both — status: superseded (by [2026-08-02-006](2026-08-02-006-plan-0013-approved-to-rejected.md))
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
