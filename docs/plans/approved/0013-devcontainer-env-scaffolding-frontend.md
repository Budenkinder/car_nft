# Plan 0013 — Scaffold `.env` files on Dev Container creation — Frontend

- **ADR:** `docs/adr/0013-devcontainer-env-scaffolding.md`
- **Paired plan:** `docs/plans/approved/0013-devcontainer-env-scaffolding-contracts.md`
- **GitHub Issue:** [#41](https://github.com/Budenkinder/car_nft/issues/41)
- **Status:** approved
- **Date:** 2026-07-23

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

**No `frontend/src` code changes.** The shared `.devcontainer/setup.sh` (created in the paired contracts plan) also scaffolds `frontend/.env.local` from `frontend/.env.example` when absent — this plan covers that half from the frontend side: verifying the scaffold behavior against the frontend app, and rotating the Pinata JWT that currently sits in `frontend/.env.local` in plaintext (decodes to a real personal email address).

**Out of scope:** any change to `frontend/src/utils/pinata_ipfs_nft_service.js` or other app code — it already reads `REACT_APP_PINATA_JWT` via `process.env` at build time; a blank vs. populated value changes runtime behavior only, not the code path.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/.env.local` | value replaced (manual, not a code change) | Rotated `REACT_APP_PINATA_JWT` pasted in by hand after generating a new, minimally-scoped Pinata key. |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [ ] **1.** No-op for `frontend/src/`. After the contracts plan's `.devcontainer/setup.sh` lands: move `frontend/.env.local` aside, run `bash .devcontainer/setup.sh`, confirm it's recreated from `frontend/.env.example` with blank `REACT_APP_PINATA_JWT` / address values, then restore the real file. Confirm `npm start` still boots against the blank-scaffold version (should show the existing "no contract configured" state, not crash) before restoring.
- [ ] **2.** Manual, not code: generate a new Pinata API key scoped to the legacy Pinning Services API with the `pinJSONToIPFS` permission only (confirmed as the sole endpoint this app calls, per this session's review of `pinata_ipfs_nft_service.js:169-185`), tied to an alias email rather than the currently-embedded personal one. Paste the resulting JWT into `frontend/.env.local`'s `REACT_APP_PINATA_JWT`.
- [ ] **3.** Manual verification: mint a test VIN record against a local Hardhat node with the rotated JWT in place, confirm `pinJSONToIPFS` succeeds and the resulting CID renders via the public gateway link (`App.js:332`).

## Interfaces with Contracts

- Functions called: unchanged — no contract interface touched by this plan.
- Events consumed: unchanged.
- ABI / address handoff: unchanged — still `contract_abi.json` + `REACT_APP_SMART_CONTRACT_ADDRESS[_LOCAL]` per ADR 0005; this plan doesn't touch that path.
- Network assumptions: unchanged.

## Testing

- Manual fresh-scaffold check (Task 1): confirms `setup.sh`'s frontend half produces a file CRA can load without crashing.
- Manual end-to-end pin test (Task 3) with the rotated JWT.
- **Not covered by this plan, flagged as an open question below:** whether a blank `REACT_APP_PINATA_JWT` currently produces a clear user-facing error from `pinJSONToIPFS`, or an unhandled fetch failure — worth observing during Task 1 but out of scope to fix here.

## Risks and Rollback

- **Risk:** none new — this plan adds no frontend code. The shared script is owned and rolled back via the contracts plan.
- **Risk:** if the rotated Pinata JWT is misconfigured (wrong scope), pinning silently fails — mitigated by the explicit end-to-end test in Task 3 before considering this plan done.

## Open Questions

- If `REACT_APP_PINATA_JWT` is blank, does `pinJSONToIPFS` fail with a clear in-app error, or a raw console/network error? Observe during Task 1; if it's poor, that's a candidate for its own future ADR/plan, not a fix bundled into this one.
