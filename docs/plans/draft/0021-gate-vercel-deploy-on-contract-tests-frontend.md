# Plan 0021 — Gate Vercel production deploys on the contract test suite — Frontend

- **ADR:** `docs/adr/0021-gate-vercel-deploy-on-contract-tests.md`
- **Paired plan:** `docs/plans/draft/0021-gate-vercel-deploy-on-contract-tests-contracts.md`
- **Status:** draft
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Reconfigure Vercel so `main` no longer auto-deploys directly on every Git push; instead, production deploys happen only via a Deploy Hook that the paired contracts plan's GitHub Actions workflow calls after `npm test` passes. This plan owns all Vercel-side setup (dashboard actions, `frontend/vercel.json`, README) — the workflow file itself and the test gate live in the paired contracts plan.

**Out of scope:** any React/UI code change; PR preview deployments (not requested).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/vercel.json` | modify | Add `"main": false` to `git.deploymentEnabled`, alongside the existing `"dev": false`. |
| `README.md` | modify | Rewrite "Deploying the frontend to Vercel" → "Subsequent pushes to `main` redeploy automatically" to describe the new gated flow. |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [ ] **1.** Manual (non-code) — in the Vercel dashboard, Project Settings → Git → Deploy Hooks: create a hook named e.g. "GitHub Actions — main", targeting the `main` branch. Copy the generated URL.
- [ ] **2.** Manual (non-code) — add that URL as a GitHub repository secret named `VERCEL_DEPLOY_HOOK_URL` (Settings → Secrets and variables → Actions), matching the name the contracts plan's workflow reads.
- [ ] **3.** Update `frontend/vercel.json`: change `"git": { "deploymentEnabled": { "dev": false } }` to `"git": { "deploymentEnabled": { "dev": false, "main": false } }` — the durable, repo-tracked record that `main` no longer auto-deploys from Git pushes (matches task 1's dashboard action; keep both in sync if either changes later).
- [ ] **4.** Update `README.md`'s "Deploying the frontend to Vercel" section:
  - Replace the closing line "Subsequent pushes to `main` redeploy automatically. Pushes to `dev` (or any other branch) do nothing in Vercel." with a description of the new flow: push to `main` → GitHub Actions runs the Hardhat contract test suite (`npm test`) → on success, it calls a Vercel Deploy Hook → Vercel builds and deploys. A failing contract test suite now blocks the production frontend deploy entirely, by design.
  - Add a one-time-setup note pointing at this plan's tasks 1–2 (Deploy Hook + GitHub secret) alongside the existing "One-time setup (Vercel Dashboard)" steps.
  - Leave "Re-deploying after a Sepolia redeploy" and the "Vercel CLI alternative" sections as-is — manual `vercel --prod` from the CLI still works and is unaffected by this change (documented as a known bypass, not solved by this plan — see Risks).

## Interfaces with Contracts

- Depends on `.github/workflows/ci.yml` (paired contracts plan) reading the exact secret name `VERCEL_DEPLOY_HOOK_URL` set in task 2 here — keep the name in sync if either side changes it.
- No ABI, address, or event changes — this plan is deploy-pipeline configuration only.

## Testing

- After task 3, confirm `frontend/vercel.json` is valid JSON and Vercel's dashboard reflects "Git deployments disabled" for `main` (no auto-deploy on a subsequent test push).
- After tasks 1–2, manually `curl -X POST` the Deploy Hook URL once and confirm a new deployment appears in the Vercel dashboard — proves the hook itself works before relying on CI to call it.
- End-to-end (covered jointly with the contracts plan's Testing section): push a passing change to `main`, confirm CI's `test` job passes, `deploy-production` fires, and a new Vercel deployment appears; push a failing change, confirm no new deployment appears.

## Risks and Rollback

- **Risk:** a manual `vercel --prod` from the CLI, or a manual "Redeploy" click in the Vercel dashboard, still bypasses this entire gate — this plan only removes the *automatic* Git-triggered path. Documented as a known, accepted limitation.
- **Risk:** if the Deploy Hook is deleted or regenerated in the Vercel dashboard without updating the GitHub secret, `main` silently stops deploying until someone notices (mitigated by the contracts plan's loud guard step, which fails the CI job rather than no-opping).
- **Rollback:** revert `frontend/vercel.json`'s `"main": false` back to just `"dev": false` (restores Vercel's automatic Git deploy for `main`); revert the README section. Deleting the Deploy Hook/secret is optional cleanup, not required for rollback to take effect.

## Open Questions

- Should PR-targeted Vercel preview deployments be added as part of this same effort (currently neither `dev` nor `main` gets previews on PRs)? Not requested — flagged as a natural follow-up, deferred.
