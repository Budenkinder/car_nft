---
date: 2026-07-28
scope: both
status: accepted
related_adr: 0021-gate-vercel-deploy-on-contract-tests
supersedes: none
---

# Gate `main`'s Vercel production deploy on `npm test` via GitHub Actions + a Deploy Hook, not a Vercel build-command override

## Context

Once plan 0020 adds `npm test` (Hardhat suite for `VinCidRegistry`/`CarRewardToken`), the user wants that suite wired into "a pipeline with Vercel" so a broken contract doesn't ship to production through the frontend. Vercel currently auto-deploys `main` on every push with no checks (`frontend/vercel.json` only disables `dev`).

## Decision

GitHub Actions runs `npm test` on every push/PR; a second job, gated on the first passing and scoped to `main` pushes only, calls a Vercel Deploy Hook to trigger the actual deploy. Vercel's automatic Git-triggered deploy for `main` is disabled (`frontend/vercel.json`: `"main": false`) so the hook becomes the only automatic path to production. Rejected running the tests inside Vercel's own build/install command — that would drag the Solidity/Hardhat toolchain into every frontend build for no benefit, and fights Vercel's `frontend/`-rooted project layout.

## Alternatives Considered

- **GitHub Actions + Vercel Deploy Hook (chosen)** — clean separation, standard CI environment and PR checks, Vercel build image stays frontend-only.
- **Run `npm test` inside Vercel's Install/Build Command override** — rejected: bloats every frontend build, awkward given the project root is `frontend/`, opaque failure surface.
- **Non-blocking informational CI only** — rejected: doesn't gate the actual Vercel pipeline, which is what was asked for.

## Consequences

- **Positive:** Production frontend deploys now require a passing contract test suite; PRs get a standard status check.
- **Negative / accepted costs:** A few minutes of added CI latency before production deploys; manual `vercel --prod` / dashboard redeploy still bypasses the gate (documented, not solved); requires one-time manual Vercel dashboard setup (Deploy Hook) and a GitHub secret.
- **Follow-ups required:** `.github/workflows/ci.yml` (contracts plan 0021); `frontend/vercel.json` + Deploy Hook + `VERCEL_DEPLOY_HOOK_URL` secret + README update (frontend plan 0021). Depends on plan 0020 shipping first.
