# Plan 0013 — Scaffold `.env` files on Dev Container creation — Contracts

- **ADR:** `docs/adr/0013-devcontainer-env-scaffolding.md`
- **Paired plan:** `docs/plans/approved/0013-devcontainer-env-scaffolding-frontend.md`
- **Status:** approved
- **Date:** 2026-07-23

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add `.devcontainer/setup.sh` — an idempotent script that scaffolds root `.env` from `.env.example` when missing (never overwrites, never contains real values) — and wire it into `.devcontainer/devcontainer.json`'s `postCreateCommand` in place of the bare `cd frontend && npm install`. Update `README.md`'s Dev Container section (added by ADR 0008) to describe the new behavior. Also track, as a manual (non-code) task, rotation of the root-side secrets already sitting in plaintext in the local `.env` (`DEPLOYER_PRIVATE_KEY`, `SEPOLIA_RPC_URL`, `ETHERSCAN_API_KEY`).

**Out of scope:** ADR 0008's still-open root-`npm install` gap (`postCreateCommand` doesn't install root Hardhat deps) — that's a separate, already-documented gotcha; see Open Questions for whether to bundle it in while `postCreateCommand` is being touched anyway. No Solidity, `hardhat.config.js`, or `scripts/deploy.js` changes.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `.devcontainer/setup.sh` | add | Idempotent scaffold for `.env` and `frontend/.env.local` (frontend half specified in the paired plan), then `cd frontend && npm install`. |
| `.devcontainer/devcontainer.json` | modify | `postCreateCommand` → `"bash .devcontainer/setup.sh"`. |
| `README.md` | modify | Update the Dev Container section to describe the scaffold behavior and that it never fills in real secrets. |
| `docs/memory/contracts/devcontainer-env-scaffold.md` | add | Memory: `setup.sh` scaffolds both env files on missing-only basis; never overwrites; never contains secrets. |
| `docs/memory/MEMORY.md` | modify | Index line for the new memory file. |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [ ] **1.** Create `.devcontainer/setup.sh`:
  - `set -euo pipefail`; `cd "$(dirname "$0")/.."` to reach the repo root regardless of invocation directory.
  - If `.env` is absent: `cp .env.example .env` and echo a reminder naming `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, and `ETHERSCAN_API_KEY` as the values to fill in before deploying.
  - If `frontend/.env.local` is absent: `cp frontend/.env.example frontend/.env.local` and echo a reminder naming `REACT_APP_PINATA_JWT` (frontend half — coordinate with the paired plan, same file).
  - Run `cd frontend && npm install` last (preserves current behavior).
  - `chmod +x .devcontainer/setup.sh`.
- [ ] **2.** Update `.devcontainer/devcontainer.json`: replace `"postCreateCommand": "cd frontend && npm install"` with `"postCreateCommand": "bash .devcontainer/setup.sh"`.
- [ ] **3.** Update `README.md`'s Dev Container section: note that `postCreateCommand` now scaffolds `.env` / `frontend/.env.local` from their `.example` templates on first creation (idempotent — leaves existing files untouched), and still does not fill in real secret values.
- [ ] **4.** Manual, not code — track as a checklist for the user, do not attempt to automate: rotate `DEPLOYER_PRIVATE_KEY` (testnet wallet), `SEPOLIA_RPC_URL` (Infura project), and `ETHERSCAN_API_KEY`, since they currently sit in plaintext in the container filesystem. Paste rotated values into `.env` by hand.
- [ ] **5.** Create `docs/memory/contracts/devcontainer-env-scaffold.md` and add its index line to `docs/memory/MEMORY.md`.

## Contract Surface

- No functions, events, storage, access control, or gas behavior change. `contracts/` is untouched.

## Interfaces with Frontend

- `.devcontainer/setup.sh` is a single shared script; this plan owns its creation and the `.env` (root) half of its logic, the paired frontend plan owns verification of the `frontend/.env.local` half and the Pinata JWT rotation task. No ABI, address, or event handoff changes — unrelated to this plan.

## Testing

- **Idempotency:** with real `.env` / `frontend/.env.local` present, run `bash .devcontainer/setup.sh` and confirm neither file's contents change (`diff` before/after).
- **Fresh-checkout simulation:** move both real files aside (e.g. to `/tmp`), run `bash .devcontainer/setup.sh`, confirm `.env` and `frontend/.env.local` are recreated from their `.example` templates with blank secret values and the reminder messages print, then restore the real files from the temp backup — never leave the workspace without the developer's real secrets.
- Confirm `npm run compile` still works unaffected (the script doesn't touch anything Hardhat reads besides `.env` itself).

## Deployment and Migration

- No on-chain migration. Tooling-only change; takes effect the next time the Dev Container / Codespace is created or rebuilt.

## Risks and Rollback

- **Risk:** a teammate mistakes the freshly scaffolded blank `.env` for a working config and attempts to deploy — mitigated by the echoed reminder naming the exact vars to fill in and pointing at `.env.example`'s comments.
- **Risk:** `.env.example` / `frontend/.env.example` drift out of sync with what `setup.sh` announces — low risk, both are small and rarely change.
- **Rollback:** revert `devcontainer.json`'s `postCreateCommand` to the previous string and delete `setup.sh`; no effect on already-provisioned workspaces since the script only acts on absent files.

## Open Questions

- Should ADR 0008's still-open root-`npm install` gap be folded into the same `setup.sh` while `postCreateCommand` is being touched anyway (i.e. add `npm install` at repo root before the `frontend` install)? Deferred to the user before this plan is approved — it's adjacent but was explicitly called out-of-scope in ADR 0008 and is not required to close the env-file gap this plan targets.
