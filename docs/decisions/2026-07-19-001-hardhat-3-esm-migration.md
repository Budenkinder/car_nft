---
date: 2026-07-19
scope: contracts
status: accepted
related_adr: 0007-hardhat-3-esm-migration
supersedes: none
---

# Migrate forward to Hardhat 3 + ESM rather than reverting to Hardhat 2

## Context

`npm run compile` failed with `ReferenceError: require is not defined in ES module scope`. Investigation traced it to an uncommitted `package.json` change that had already bumped `hardhat` to `^3.10.0` and set `"type": "module"`, while `hardhat.config.js` and `scripts/deploy.js` were still written for Hardhat 2's CommonJS API. The installed `@nomicfoundation/hardhat-toolbox@7.0.0` was also found to be a non-functional deprecation shim (it `process.exit(1)`s unconditionally), independent of the ESM issue. Two viable directions existed: finish the Hardhat 3 migration, or roll back the uncommitted bump to restore the last committed (Hardhat 2) state. This was surfaced to the user directly since it's a scope-defining call the code alone couldn't resolve.

## Decision

Migrate forward to Hardhat 3. The user chose this over reverting when asked directly (`AskUserQuestion`, options: "Revert to Hardhat 2 (Recommended)" vs. "Migrate forward to Hardhat 3"). ADR 0007 and plan trio 0007 (frontend: no-op; contracts: config + script rewrite) were authored on this basis.

## Alternatives Considered

- **Migrate forward to Hardhat 3** — chosen. Larger diff now, but avoids re-deferring an already-half-applied upgrade.
- **Revert to Hardhat 2** — smallest diff, matches last committed state, but leaves the eventual Hardhat 3 migration as unfinished future work.

## Consequences

- **Positive:** scope is now unambiguous; ADR 0007 documents the full technical rationale (dead toolbox shim, Hardhat 3 config API shape, `network.create()`/`configVariable()` usage) so implementation can proceed without re-litigating the direction.
- **Negative / accepted costs:** contracts-side plan 0007 is a real migration (new toolbox package, rewritten `hardhat.config.js` and `scripts/deploy.js`), not a one-line fix.
- **Follow-ups required:** implement plan 0007 (contracts) on explicit `implement`/`autonomous` command per CLAUDE.md workflow rule 5; no frontend follow-up (plan 0007 frontend is a no-op).
