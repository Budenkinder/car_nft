# ADR 0007: Migrate Hardhat config and scripts to Hardhat 3 + ESM

- **Status:** accepted
- **Date:** 2026-07-19
- **Scope:** contracts
- **Related plans:**
  - `docs/plans/done/0007-hardhat-3-esm-migration-frontend.md`
  - `docs/plans/done/0007-hardhat-3-esm-migration-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-19-001-hardhat-3-esm-migration.md`, `docs/decisions/2026-07-19-002-plan-0007-draft-to-in-progress.md`, `docs/decisions/2026-07-19-003-plan-0007-in-progress-to-done.md`

## Context

`npm run compile` fails inside the dev container:

```
ReferenceError: require is not defined in ES module scope, you can use import instead
```

Investigation showed this is not a simple CJS/ESM mismatch. An **uncommitted** local change to `package.json` had already bumped `hardhat` from the committed `^2.28.6` to `^3.10.0` and flipped `"type": "commonjs"` to `"type": "module"`, but `hardhat.config.js` and `scripts/deploy.js` were never rewritten — they still use Hardhat 2's CommonJS API (`require`, `module.exports`, `solidity.version`/`networks.<name>.url` directly, no `type` discriminator on networks).

Compounding this, the currently installed `@nomicfoundation/hardhat-toolbox@7.0.0` is not a working plugin bundle at all — its `index.js` is a deprecation shim that prints a migration notice and calls `process.exit(1)` unconditionally. It works with neither Hardhat 2 nor Hardhat 3. Hardhat 3 uses a different config API entirely (`defineConfig`, a `plugins` array, `configVariable()` for secrets/RPC URLs, a `type: "http" | "edr-simulated"` discriminator on each network entry) and a different toolbox package per test stack (`@nomicfoundation/hardhat-toolbox-mocha-ethers` for the ethers+Mocha stack this project already uses, vs. `hardhat-toolbox-viem`).

This needed a real decision, not a silent pick: finish the Hardhat 3 migration properly, or roll back the uncommitted bump and restore the committed Hardhat 2 baseline. The user chose to migrate forward to Hardhat 3.

## Decision

Complete the Hardhat 3 migration:

1. Keep `"type": "module"` in `package.json` and `hardhat: ^3.10.0`.
2. Replace `@nomicfoundation/hardhat-toolbox@7.0.0` (dead shim) with `@nomicfoundation/hardhat-toolbox-mocha-ethers` (the ethers + Mocha toolbox — matches this project's existing ethers-based `scripts/deploy.js`), which transitively pulls in `hardhat-ethers`, `hardhat-verify`, `hardhat-keystore`, `hardhat-network-helpers`, `hardhat-ignition-ethers`, `hardhat-typechain`, and `hardhat-ethers-chai-matchers`.
3. Rewrite `hardhat.config.js` as ESM: `import`/`export default defineConfig({...})`, `plugins: [hardhatToolboxMochaEthersPlugin]`, Sepolia network entry gets `type: "http"` and RPC URL / private key wrapped in `configVariable(...)`, and the Etherscan API key moves under the new `verify.etherscan.apiKey` field (also `configVariable(...)`). Drop the old top-level `sourcify: { enabled: false }` block — the new `hardhat-verify` plugin has no automatic post-deploy Sourcify attempt to silence; verification is opt-in via the `hardhat verify` CLI task.
4. Rewrite `scripts/deploy.js` as ESM: `import` instead of `require`, `fileURLToPath(import.meta.url)` in place of `__dirname`, and replace direct `hre.ethers`/`hre.network.name` access with `const { ethers, networkName } = await network.create();` (Hardhat 3's network-connection API — it auto-picks up the `--network` flag passed to `hardhat run`, same as before).
5. No Solidity source changes and no ABI/event/address-handoff changes — the migration is confined to tooling.

## Options Considered

### Option A — Migrate forward to Hardhat 3 *(chosen)*
- **Pros:** stays on the actively maintained major version; unblocks compiling/deploying inside the dev container without re-reverting a change that was already half-applied; gets Hardhat 3 features (typed network connections, built-in verify/keystore/network-helpers plugins) for free.
- **Cons:** larger diff — config file, deploy script, and dependency set all change; new API surface (`network.create()`, `configVariable()`) to learn; Hardhat 3's ecosystem (plugins, examples) is newer and thinner than Hardhat 2's.

### Option B — Revert to Hardhat 2 (roll back the uncommitted bump)
- **Pros:** smallest possible diff — discard the uncommitted `package.json` change, reinstall `hardhat@^2.28.6` + `hardhat-toolbox@^6`, zero changes to `hardhat.config.js` or `scripts/deploy.js`. Matches the last committed, previously-working state exactly.
- **Cons:** leaves the project on an old major version; the compile error resurfaces the moment anyone re-attempts the Hardhat 3 bump later, so the work is only deferred, not avoided.

### Option C — Keep `type: "module"` but isolate Hardhat as CommonJS via `.cjs`
- **Pros:** avoids touching `hardhat.config.js`/`scripts/deploy.js` syntax at all — just rename to `.cjs`.
- **Cons:** does not fix the actual blocker, since `hardhat-toolbox@7.0.0` is a dead shim regardless of module format; the config would still be written against the Hardhat 2 API and fail against the installed Hardhat 3 core. Rejected because it papers over the real problem (wrong toolbox package, wrong config schema) rather than resolving it.

## Consequences

- **Positive:** `npm run compile` and `npm run deploy:*` work again, on the currently-installed Hardhat 3 line; the project picks up Hardhat 3's built-in network-helpers, keystore, and verify plugins instead of hand-rolled equivalents.
- **Negative:** anyone touching `hardhat.config.js` or `scripts/deploy.js` now needs to know the Hardhat 3 API (`network.create()`, `configVariable()`) rather than the more widely-documented Hardhat 2 API; the dependency set changes (new toolbox package, several new transitive `@nomicfoundation/*` packages).
- **Frontend impact:** none. `scripts/deploy.js` still writes the same files to the same frontend paths (`frontend/.env.local`, `frontend/src/utils/contract_abi.json`) in the same format — see the paired frontend plan.
- **Contracts impact:** `hardhat.config.js`, `scripts/deploy.js`, and `package.json`/`package-lock.json` change. No Solidity source changes. `deployments/*.json` and `docs/deployments/*.md` output formats are unchanged.
- **Follow-ups:** none anticipated. If Solidity-level tests are added later, they should follow the Hardhat 3 Mocha + `network.create()` pattern documented in the `hardhat`/`hardhat-toolbox-mocha-ethers` skills bundled with the `hardhat` npm package (`node_modules/hardhat/skills/`).

## References

- `node_modules/hardhat/skills/hardhat/SKILL.md`, `node_modules/hardhat/skills/hardhat-toolbox-mocha-ethers/SKILL.md` — bundled with the installed `hardhat` package, cover `network.create()`, ethers helpers, and chai matchers for Hardhat 3.
- https://hardhat.org/docs/guides/deployment/using-scripts — deployment script pattern (`network.create()`, `--network` flag pass-through).
- https://hardhat.org/docs/plugins/hardhat-verify — `verify.etherscan.apiKey` config shape.
- https://hardhat.org/migrate-to-esm — referenced directly in the original error message.
- `node_modules/hardhat/src/internal/core/configuration-variables.ts` — confirms `configVariable(name)` resolves from `process.env[name]` by default.
