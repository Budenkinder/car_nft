# ADR 0008: Document the Hardhat 3 migration and Dev Container in README

- **Status:** accepted
- **Date:** 2026-07-19
- **Scope:** both
- **Related plans:**
  - `docs/plans/done/0008-readme-hardhat3-devcontainer-docs-frontend.md`
  - `docs/plans/done/0008-readme-hardhat3-devcontainer-docs-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-19-005-plan-0008-draft-to-in-progress.md`, `docs/decisions/2026-07-19-006-plan-0008-in-progress-to-done.md`

## Context

Two things changed recently that `README.md` doesn't reflect:

1. The Hardhat tooling migrated from Hardhat 2/CommonJS to Hardhat 3/ESM (ADR 0007, plan 0007) — `hardhat.config.js` and `scripts/deploy.js` are now ESM, the toolbox package is `@nomicfoundation/hardhat-toolbox-mocha-ethers`, and compile now also produces a gitignored `types/` (TypeChain) directory.
2. `.devcontainer/devcontainer.json` exists (Ubuntu 24.04 base image, Node 22 feature, zsh, GitHub CLI, ESLint/Solidity/Prettier VS Code extensions, port 3000 forwarded, `postCreateCommand: cd frontend && npm install`) but the README has no mention of it — a new contributor opening this repo in VS Code / Codespaces has no signal that a Dev Container is available, or that `postCreateCommand` only installs the `frontend/` dependencies and root-level `npm install` (for Hardhat) still has to be run manually.

Both are documentation gaps, not code changes — the ask is to bring `README.md` up to date with the current, already-implemented state of the repo.

## Decision

Update `README.md` in two places:

- **Contracts-facing:** add a short note near "Deploying the smart contracts" / "Prerequisites" that the Hardhat setup is Hardhat 3 running as an ESM project (`"type": "module"` in `package.json`), so anyone editing `hardhat.config.js` or `scripts/deploy.js` knows to use `import`/`export`, not `require`.
- **Frontend-facing / repo-wide dev environment:** add a new "Development environment" section documenting the Dev Container: what it provisions (Ubuntu 24.04, Node 22, zsh, GitHub CLI, the three VS Code extensions), that port 3000 auto-forwards for the CRA dev server, and — the one actionable gotcha — that `postCreateCommand` only runs `npm install` inside `frontend/`, so a fresh container still needs `npm install` run once at the repo root before `npm run compile`/`npm run node`/`npm run deploy:*` will work.

No code changes — `README.md` only.

## Options Considered

### Option A — Add both notes to README *(chosen)*
- **Pros:** closes the documentation gap directly where a new contributor will look first; captures the root-`npm install` gotcha so it isn't rediscovered the hard way.
- **Cons:** one more section to keep in sync if the Dev Container config changes again.

### Option B — Leave README as-is, rely on `.devcontainer/devcontainer.json` and CLAUDE.md/memory for context
- **Pros:** zero effort.
- **Cons:** README is the first thing a human contributor reads; `.devcontainer/` and `docs/memory/` are easy to miss. Doesn't fix the actual problem (discoverability for humans, not Claude).

### Option C — Fix the Dev Container's `postCreateCommand` instead of documenting the gap
- **Pros:** removes the manual step entirely (`postCreateCommand` could run `npm install && cd frontend && npm install`).
- **Cons:** out of scope — the user asked for README updates, not a devcontainer config change; changing `postCreateCommand` is a separate, reversible-but-distinct decision that deserves its own ask/ADR if wanted.

## Consequences

- **Positive:** README accurately reflects the current Hardhat major version/module system and the Dev Container option; the root-`npm install` gotcha is written down once instead of being rediscovered per contributor.
- **Negative:** none of substance — pure documentation addition.
- **Frontend impact:** none to `frontend/` code; README only.
- **Contracts impact:** none to `contracts/`/`hardhat.config.js`/`scripts/`; README only.
- **Follow-ups:** if `.devcontainer/devcontainer.json`'s `postCreateCommand` is later changed to also install root deps (Option C), the README note should be revisited so it doesn't describe a gotcha that no longer exists.

## References

- ADR 0007 — `docs/adr/0007-hardhat-3-esm-migration.md` (the Hardhat 3 migration this documents).
- `.devcontainer/devcontainer.json` — the Dev Container config being documented.
