# ADR 0021: Gate Vercel production deploys on the contract test suite via GitHub Actions + a Deploy Hook

- **Status:** accepted
- **Date:** 2026-07-28
- **Scope:** both
- **Related plans:**
  - `docs/plans/draft/0021-gate-vercel-deploy-on-contract-tests-frontend.md`
  - `docs/plans/draft/0021-gate-vercel-deploy-on-contract-tests-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-28-003-gate-vercel-deploy-on-contract-tests.md`

## Context

Today, Vercel's Git integration auto-deploys `main` on every push with no automated checks in front of it (`frontend/vercel.json` only disables `dev`: `"git": {"deploymentEnabled": {"dev": false}}`; `main` is enabled by Vercel's default). A broken contract — or, once plan 0020 ships, a contract that fails its own test suite — does not block a frontend production deploy today. Per this repo's own CLAUDE.md framing, frontend and contracts are "one product with two sides," so a broken contracts side arguably should block a production frontend release.

This ADR depends on plan 0020 (`npm test` at the repo root, running the Hardhat suite for `VinCidRegistry`/`CarRewardToken`) already existing as the thing to gate on.

## Decision

Add a GitHub Actions workflow (`.github/workflows/ci.yml`) with two jobs: `test` (runs `npm test` on every push and pull request) and `deploy-production` (runs only for pushes to `main`, only if `test` passed, and its single step calls a Vercel Deploy Hook URL). Disable Vercel's automatic Git-triggered deploy for `main` (`frontend/vercel.json`: `"main": false`, alongside the existing `"dev": false`), so the only way `main` reaches production is through this gated pipeline. Vercel's build image stays frontend-only — it never needs the Solidity/Hardhat toolchain; the contract tests run in GitHub Actions, a general-purpose CI environment, and only a webhook call crosses into Vercel.

## Options Considered

### Option A — GitHub Actions runs `npm test`, then calls a Vercel Deploy Hook on success (chosen)
- **Pros:** Vercel's build image stays fast and frontend-only (no Solidity toolchain bloat). Tests run in a standard CI environment with proper PR status checks and readable logs/annotations. Clean separation: GitHub Actions decides *whether* to deploy, Vercel still owns *how* to build/deploy the frontend. Matches the "one coupled product" philosophy by making a broken contract suite block production.
- **Cons:** Requires one-time manual Vercel dashboard setup (create the Deploy Hook, disable Git auto-deploy for `main`) plus a GitHub Actions secret — manual, non-code tasks. Adds GitHub Actions run time (Node install + compile + test) before a production deploy, versus Vercel's near-instant auto-deploy. Two systems now jointly own "when does `main` deploy."

### Option B — Run `npm test` inside Vercel's own Install/Build Command override
- **Pros:** Single system (Vercel only); no GitHub Actions, no Deploy Hook, no secrets to manage.
- **Cons:** Bloats every frontend deploy's build image with the full Hardhat/Solidity toolchain for a check that has nothing to do with building the frontend bundle. The Vercel project's root directory is configured as `frontend/` (per the existing Vercel setup in README), so reaching root-level `contracts/`/`hardhat.config.js` means fighting the platform's directory model with override commands. A failing test would surface as an opaque Vercel build failure rather than a proper GitHub PR check. Rejected as architecturally messier for a narrower win.

### Option C — Separate, non-blocking GitHub Actions CI (informational only, no deploy gating)
- **Pros:** Simplest possible change — zero Vercel dashboard edits.
- **Cons:** Doesn't satisfy the actual ask ("how this can be done via pipeline with Vercel" implies gating the Vercel pipeline itself). A broken contract suite could still ship to production through the frontend. Rejected.

## Consequences

- **Positive:** A failing contract test suite now blocks production frontend deploys, closing the "one product, two sides" gap. PRs get a visible, standard GitHub status check for contract health. `dev`/other branches remain fully unaffected (never deployed, same as before).
- **Negative:** Production deploys gain a few minutes of latency (CI run time) versus instant Vercel auto-deploy. A misconfigured or missing `VERCEL_DEPLOY_HOOK_URL` secret would silently stop `main` from deploying at all unless the workflow guards against it loudly (addressed in the contracts plan's task design). A manual `vercel --prod` from the CLI or dashboard can still bypass this gate entirely — the pipeline only controls the *automatic* Git-triggered path, and that limitation is accepted and documented, not solved.
- **Frontend impact:** `frontend/vercel.json` gains `"main": false`; a new "Deploying the frontend to Vercel" README description of the gated flow; one-time manual Vercel Deploy Hook creation + GitHub secret.
- **Contracts impact:** New `.github/workflows/ci.yml` running `npm test` (from plan 0020) on every push/PR.
- **Follow-ups:** Whether to also run the frontend's own test suite (`react-scripts test`) in the same gate, and whether PR-targeted Vercel preview deployments are wanted, are both out of scope here — flagged as Open Questions in the plans.

## References

- Plan 0020 (`docs/plans/draft/0020-automated-hardhat-test-suite-contracts.md`) — the `npm test` command this ADR gates on.
- `frontend/vercel.json` — current Git deploy config (`dev` disabled, `main` implicitly enabled).
- `README.md`'s existing "Deploying the frontend to Vercel" section — describes the current (ungated) auto-deploy-on-push-to-`main` flow this ADR replaces.
- [Vercel Deploy Hooks docs](https://vercel.com/docs/deployments/deploy-hooks) — the webhook mechanism this ADR relies on.
