# Plan 0005 — Deploy script syncs the frontend (address + ABI) — Contracts

- **ADR:** `docs/adr/0005-deploy-script-frontend-sync.md`
- **Paired plan:** `docs/plans/done/0005-deploy-script-frontend-sync-frontend.md`
- **Status:** done
- **Date:** 2026-05-21

> Plan files live in a subfolder named after their `Status:` value. New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Extend `scripts/deploy.js` so every deploy fully syncs the frontend: (1) the new `VinCidRegistry` address is written into `frontend/.env.local` for `sepolia` as well as `localhost`/`hardhat`; (2) the freshly compiled `VinCidRegistry` ABI is copied into `frontend/src/utils/contract_abi.json` on every network. Absorbs the ABI-sync scope of the never-created plan 0003.

**Out of scope:** any Solidity change; `hardhat.config.js`; `package.json` scripts; syncing `CarRewardToken`'s ABI (the frontend consumes only `VinCidRegistry`); updating Vercel production env vars (still manual).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `scripts/deploy.js` | modify | Add `upsertEnvVar` helper; sepolia env write; ABI-sync step. |
| `docs/memory/contracts/deploy-syncs-frontend.md` | add | Memory: deploy.js auto-writes the FE address + ABI; `contract_abi.json` is generated. |
| `docs/memory/MEMORY.md` | modify | Index line for the new memory file. |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [x] **1.** In `scripts/deploy.js`, add a module-level helper `upsertEnvVar(envPath, key, value)` that reads the file (empty string if absent), replaces an existing `^KEY=.*$` line (multiline regex) or appends `KEY=value` with a trailing newline, and writes it back. This is the existing localhost env-write logic, extracted verbatim so both branches share it.
- [x] **2.** Rework the "Frontend wiring" block: for `localhost`/`hardhat`, call `upsertEnvVar(<.env.local>, "REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL", registryAddress)`; for `sepolia`, call `upsertEnvVar(<.env.local>, "REACT_APP_SMART_CONTRACT_ADDRESS", registryAddress)` **and** keep the existing Vercel-instruction console output; leave the `else` branch unchanged. Keep the "restart the dev server" log line for the local-writing branches.
- [x] **3.** Add an ABI-sync step that runs **unconditionally on every network**, after the address write: resolve `artifacts/contracts/car_nft_sc.sol/VinCidRegistry.json` via `path.join(__dirname, "..", ...)`; if it is missing, log a clear "run `npm run compile` first" error and `process.exitCode = 1` then `return`; otherwise read it, `JSON.parse`, and write `JSON.stringify(artifact.abi, null, 2) + "\n"` to `frontend/src/utils/contract_abi.json`. Log the destination path.
- [x] **4.** Create `docs/memory/contracts/deploy-syncs-frontend.md` and add its index line to `docs/memory/MEMORY.md`.

## Contract Surface

- No functions, events, storage, access control, or gas behaviour change. `contracts/` is untouched.

## Interfaces with Frontend

- ABI written to `frontend/src/utils/contract_abi.json` (pretty-printed, 2-space indent, trailing newline — matching the existing file so re-syncs of an unchanged contract produce a zero diff).
- Address written to `frontend/.env.local` keys `REACT_APP_SMART_CONTRACT_ADDRESS` (sepolia) / `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` (localhost), consumed by `frontend/src/utils/contract_utils.js`.
- No events; no on-chain interface change.

## Testing

- **Local:** `npm run compile` then `npm run deploy:local` → `frontend/.env.local` has the new `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL`; `git diff frontend/src/utils/contract_abi.json` is empty (contract source unchanged) or a clean ABI diff.
- **Sepolia:** `npm run deploy:sepolia` → `.env.local` gains/updates `REACT_APP_SMART_CONTRACT_ADDRESS`, and the Vercel instruction is still printed.
- **Negative (ABI):** move `artifacts/contracts/car_nft_sc.sol/VinCidRegistry.json` aside and re-run a deploy → script fails with the "compile first" message and a non-zero exit. Restore afterwards.
- No Hardhat unit tests added — `contracts/` behaviour is unchanged and there is still no `test/` directory.

## Deployment and Migration

- No on-chain migration. This is a tooling change; it takes effect on the next `deploy:local` / `deploy:sepolia` run.

## Risks and Rollback

- **Risk:** ABI re-write produces noisy diffs if formatting drifts — mitigated by matching the existing 2-space + trailing-newline format.
- **Risk:** writing `.env.local` on Sepolia deploys touches a developer-local file — acceptable; it is gitignored and the localhost branch already does this.
- **Rollback:** revert the `scripts/deploy.js` change; the frontend keeps working as long as `contract_abi.json` and `.env.local` retain valid values.

## Open Questions

- None. Enforcement (automate in deploy.js) and ABI-sync combination confirmed with the user.
