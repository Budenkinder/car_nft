# Plan 0021 — Gate Vercel production deploys on the contract test suite — Contracts

- **ADR:** `docs/adr/0021-gate-vercel-deploy-on-contract-tests.md`
- **Paired plan:** `docs/plans/draft/0021-gate-vercel-deploy-on-contract-tests-frontend.md`
- **Status:** draft
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a GitHub Actions workflow that runs the root Hardhat test suite (`npm test`, from plan 0020) on every push and pull request, and — only for pushes to `main`, only after tests pass — calls a Vercel Deploy Hook to trigger the production deploy. This is the CI half of ADR 0021; the paired frontend plan owns the Vercel-side setup (Deploy Hook creation, `vercel.json` change, GitHub secret, README).

**Depends on plan 0020** having shipped (`npm test` must exist and pass/fail meaningfully). **Out of scope:** running the frontend's own test suite in this workflow; PR preview deployments; any change to `contracts/*.sol` or `scripts/deploy.js`.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `.github/workflows/ci.yml` | add | `test` job (push + pull_request, all branches) and `deploy-production` job (`needs: test`, `main` pushes only) that calls the Vercel Deploy Hook. |
| `README.md` | modify | Note under a new "Continuous Integration" (or existing testing) section: every push/PR runs `npm test`. |
| `docs/memory/contracts/hardhat-automated-test-suite.md` | modify | Add a line noting CI now runs `npm test` on every push (link to ADR 0021). |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [ ] **1.** Create `.github/workflows/ci.yml` with a `test` job: trigger on `push` (any branch) and `pull_request` (any base); steps: checkout (`actions/checkout@v4`), `actions/setup-node@v4` with `node-version: 22` (matching the devcontainer's Node feature) and `cache: npm`, `npm ci` (root), `npm run compile`, `npm test`.
- [ ] **2.** Add a second job, `deploy-production`, to the same workflow file: `needs: test`, `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`. Single step: guard that `secrets.VERCEL_DEPLOY_HOOK_URL` is non-empty (fail loudly with a clear message if not, rather than silently no-opping), then `curl -fsS -X POST "${{ secrets.VERCEL_DEPLOY_HOOK_URL }}"`.
- [ ] **3.** Update `README.md`: add a short "Continuous Integration" note (near the existing testing/Vercel sections) — every push and PR runs `npm test` via `.github/workflows/ci.yml`; only `main` pushes that pass it trigger a production deploy (details in the Vercel section, owned by the paired frontend plan).
- [ ] **4.** Update `docs/memory/contracts/hardhat-automated-test-suite.md`: append a line noting CI now runs `npm test` on every push via `.github/workflows/ci.yml` (ADR 0021).

## Contract Surface

- No changes — `contracts/car_nft_sc.sol` and `contracts/car_reward_token.sol` untouched.

## Interfaces with Frontend

- This workflow's `deploy-production` job calls `${{ secrets.VERCEL_DEPLOY_HOOK_URL }}` — the paired frontend plan is responsible for actually creating that Vercel Deploy Hook and setting the GitHub secret's value, and for disabling Vercel's automatic Git deploy for `main` so this hook becomes the only path to production. Without the frontend plan's tasks, this job will fail its guard step (task 2) rather than silently doing nothing.

## Testing

- Push a commit to a non-`main` branch (or open a PR) and confirm the `test` job runs and reports status, and `deploy-production` does **not** run (branch/event condition correctly excludes it).
- Temporarily break a test on a branch, merge to `main`, confirm `test` fails and `deploy-production` is skipped (never calls the hook).
- Fix the test, merge to `main`, confirm `test` passes and `deploy-production` runs; verify the guard step passes once the frontend plan's secret is in place.
- Confirm the workflow's Node version (22) matches `npm ci`'s expectations (root `package-lock.json` resolves cleanly in CI).

## Deployment and Migration

- Not applicable — CI/tooling only, no on-chain migration.

## Risks and Rollback

- **Risk:** if `VERCEL_DEPLOY_HOOK_URL` is missing or wrong, `main` stops deploying entirely until fixed — mitigated by task 2's explicit guard, which fails the job loudly (visible in the Actions tab) instead of a silent no-op `curl` against an empty URL.
- **Risk:** adds a few minutes of CI latency before every production deploy versus Vercel's previous instant auto-deploy — accepted trade-off, matches the user's explicit ask to gate on tests.
- **Rollback:** delete `.github/workflows/ci.yml`; combined with the frontend plan's rollback (re-enabling Vercel's automatic Git deploy), this fully restores today's ungated behavior.

## Open Questions

- Should this workflow also run the frontend's own `npm test` (`react-scripts test`, inside `frontend/`) before calling the deploy hook? Not requested by the user (scoped to "the contract and the reward contract") — flagged as a natural extension, deferred.
