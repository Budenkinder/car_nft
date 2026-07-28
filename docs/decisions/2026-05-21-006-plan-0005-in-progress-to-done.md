---
date: 2026-05-21
scope: both
status: accepted
related_adr: 0005-deploy-script-frontend-sync
supersedes: none
---

# Plan 0005 transitioned in-progress → done; ADR 0005 bumped proposed → accepted

## Context

All tasks in plan 0005 (deploy.js syncs the frontend address + ABI) completed during the autonomous run. `scripts/deploy.js` gained an `upsertEnvVar(envPath, key, value)` helper; the "Frontend wiring" block now upserts `REACT_APP_SMART_CONTRACT_ADDRESS` into `frontend/.env.local` for `sepolia` (and still prints the Vercel instruction) as well as `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` for `localhost`/`hardhat`; a new "Frontend ABI sync" step copies the compiled `VinCidRegistry` ABI into `frontend/src/utils/contract_abi.json` on every network, aborting with a non-zero exit if the artifact is missing. The `docs/memory/contracts/deploy-syncs-frontend.md` memory entry was added. `node --check scripts/deploy.js` passed and `CI=true npm run build` compiled. Deploy-path verification (running `deploy:local` / `deploy:sepolia`) is deferred to the user, since it mutates `.env.local` / `contract_abi.json` and needs a Hardhat node or testnet ETH.

## Decision

Move the plan trio from `docs/plans/in-progress/` to `docs/plans/done/`, update each plan's `Status:` + `Paired plan:`, repoint the ADR's `Related plans:` paths, and bump ADR 0005's `Status:` from `proposed` to `accepted`. Decision `2026-05-21-004` (the deploy-sync decision) is bumped `proposed` → `accepted` for the same reason.

## Alternatives Considered

- **Leave ADR at `proposed`** — rejected. With both plans `done` and the change shipped in `scripts/deploy.js`, `proposed` would misrepresent the decision's state.
- **Run a full `deploy:local` as part of this autonomous run** — rejected. It would rewrite the developer's gitignored `.env.local` and the tracked `contract_abi.json` to a throwaway node's values; deploy-path verification is left to the user (parallels deferring browser testing for plan 0004).

## Consequences

- **Positive:** `ls docs/plans/done/` now shows the shipped 0005 trio; the ADR and the deploy-sync decision are `accepted`. The never-created plan 0003's ABI-sync scope is fully absorbed.
- **Negative / accepted costs:** the end-to-end deploy verification (Sepolia address landing in `.env.local`, ABI re-written) is unverified by the implementation run and remains on the user's side.
- **Follow-ups required:** user should run `npm run deploy:local` (or `deploy:sepolia`) and confirm `.env.local` + `contract_abi.json` are updated; the first such run may produce a one-time formatting diff on `contract_abi.json` (it is now a generated artifact).
