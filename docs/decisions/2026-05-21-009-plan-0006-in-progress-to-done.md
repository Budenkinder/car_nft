---
date: 2026-05-21
scope: contracts
status: accepted
related_adr: 0006-sepolia-deploy-address-log
supersedes: none
---

# Plan 0006 transitioned in-progress → done; ADR 0006 bumped proposed → accepted

## Context

All tasks in plan 0006 (Sepolia deploys write a dated address log) completed during the autonomous run. `scripts/deploy.js` gained a `network === "sepolia"`-gated step that writes `docs/deployments/sepolia_contract_deploy_addresses_<YYYY-MM-DD>.md` — deploy metadata plus a table of `VinCidRegistry` and `CarRewardToken` with addresses rendered as Etherscan Sepolia links. The `docs/memory/contracts/sepolia-deploy-log.md` memory entry was added. `node --check scripts/deploy.js` passed. Deploy-path verification (a real `deploy:sepolia` actually producing the file) is deferred to the user — it needs testnet ETH; the localhost-skips-the-log path is guaranteed by the `sepolia` gate.

## Decision

Move the plan trio from `docs/plans/in-progress/` to `docs/plans/done/`, update each plan's `Status:` + `Paired plan:`, repoint the ADR's `Related plans:` paths, and bump ADR 0006's `Status:` from `proposed` to `accepted`. Decision `2026-05-21-007` (the deploy-log decision) is bumped `proposed` → `accepted` for the same reason.

## Alternatives Considered

- **Leave ADR at `proposed`** — rejected. With both plans `done` and the change shipped in `scripts/deploy.js`, `proposed` would misrepresent the decision's state.
- **Run a real `deploy:sepolia` as part of this autonomous run** — rejected. It spends testnet ETH and deploys live contracts; deploy-path verification is left to the user.

## Consequences

- **Positive:** `ls docs/plans/done/` now shows the shipped 0006 trio; the ADR and the deploy-log decision are `accepted`.
- **Negative / accepted costs:** the end-to-end verification (a real Sepolia deploy producing `docs/deployments/...md`) is unverified by the implementation run and remains on the user's side.
- **Follow-ups required:** user should run `npm run deploy:sepolia` and confirm the dated log file appears under `docs/deployments/`.
