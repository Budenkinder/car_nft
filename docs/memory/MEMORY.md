# Memory Index

This is the index of all repo-tracked memory. Every memory file under `docs/memory/frontend/` or `docs/memory/contracts/` must have a one-line entry here.

**Memory location is fixed:** project memory lives only under `docs/memory/`. Never write to `.claude/` or `~/.claude/`.

Format: `- [Title](relative/path.md) — one-line hook`

> Do not write memory content in this file. This file is an index only.
> Keep this file under ~200 lines; if it grows past that, the index is being misused.

## Frontend (`docs/memory/frontend/`)

- [Plans live in status-named subfolders](frontend/plan-status-folders.md) — draft/approved/in-progress/done/rejected; both plans in a trio move together when status changes (per ADR 0002).
- [Contract access uses web3.js + a service layer](frontend/web3js-contract-access-pattern.md) — frontend uses web3.js not ethers; all reads/writes funnel through pinata_ipfs_nft_service.js.

## Contracts (`docs/memory/contracts/`)

- [deploy.js auto-syncs the frontend](contracts/deploy-syncs-frontend.md) — every deploy writes the contract address to `.env.local` and the ABI to `contract_abi.json`; treat `contract_abi.json` as generated.
