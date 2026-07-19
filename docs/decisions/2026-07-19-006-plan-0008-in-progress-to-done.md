---
date: 2026-07-19
scope: both
status: accepted
related_adr: 0008-readme-hardhat3-devcontainer-docs
supersedes: none
---

# Plan 0008 transitioned in-progress → done; ADR 0008 bumped proposed → accepted

## Context

User issued `autonomous`; both tasks in plan 0008 were executed: the frontend-side "Development environment" section (Dev Container: image/features, port 3000, extensions, the `postCreateCommand` root-install gotcha) was added to `README.md` after "Repository layout", and the contracts-side note (Hardhat 3, ESM, `hardhat-toolbox-mocha-ethers`, gitignored `types/`) was added to the "Deploying the smart contracts" section. Both tasks are checked off in their respective plan files.

## Decision

Moved both `0008-readme-hardhat3-devcontainer-docs-frontend.md` and `0008-readme-hardhat3-devcontainer-docs-contracts.md` from `docs/plans/in-progress/` to `docs/plans/done/`. Updated `Status:` frontmatter and `Paired plan:` paths in both files. Bumped ADR 0008 from `proposed` to `accepted` and rewrote its `Related plans:` paths to `done/`.

## Alternatives Considered

- **Move to `done/` now that both tasks are checked off** — chosen; matches the documented `done/` criterion.
- **Hold in `in-progress/` pending further review** — rejected; both edits are complete, verified by re-reading the rendered sections, and there is no outstanding task in either plan file.

## Consequences

- **Positive:** `README.md` now documents both the Hardhat 3/ESM migration and the Dev Container; plan folder state reflects completed work.
- **Negative / accepted costs:** none.
- **Follow-ups required:** none blocking. If `.devcontainer/devcontainer.json`'s `postCreateCommand` is ever changed to also install root dependencies, revisit the README note added here (per ADR 0008's Option C / Follow-ups).
