---
name: hardhat-3-esm-migration
description: Project runs Hardhat 3 + ESM (not Hardhat 2/CommonJS); config and scripts use defineConfig/network.create()/configVariable, and hardhat-toolbox must be hardhat-toolbox-mocha-ethers, never the plain hardhat-toolbox package.
metadata:
  type: project
  scope: contracts
---

`package.json` has `"type": "module"` and `hardhat: ^3.10.0` (migrated per ADR 0007 / plan 0007). `hardhat.config.js` and `scripts/deploy.js` are ESM (`import`/`export default`), not CommonJS.

**Why:** an ESM/Hardhat-3 bump was made locally before the config and scripts were rewritten, causing `npm run compile` to fail with "require is not defined in ES module scope". Investigating it surfaced a second, independent landmine: `@nomicfoundation/hardhat-toolbox@7.0.0` (the "latest" tag) is **not a working plugin** — its `index.js` is a pure deprecation shim that prints a migration notice and calls `process.exit(1)` unconditionally, regardless of Hardhat version. The correct Hardhat 3 package for this project's ethers+Mocha stack is `@nomicfoundation/hardhat-toolbox-mocha-ethers` (there's also a `hardhat-toolbox-viem` variant for projects using viem instead — not this one).

**How to apply:**
- Never reinstall or suggest `@nomicfoundation/hardhat-toolbox` (no version suffix / `latest`) for this repo — it will always fail with `process.exit(1)`. Use `@nomicfoundation/hardhat-toolbox-mocha-ethers`.
- Hardhat 3 config shape: `import { configVariable, defineConfig } from "hardhat/config"`, `export default defineConfig({ plugins: [...], networks: { <name>: { type: "http" | "edr-simulated", url: configVariable("X"), accounts: [configVariable("Y")] } }, verify: { etherscan: { apiKey: configVariable("Z") } } })`. `solidity: { version, settings }` (the old single-version shape) is still valid — no need for the `profiles` form unless multiple build profiles are wanted.
- `configVariable(name)` resolves from `process.env[name]` by default (confirmed by reading `node_modules/hardhat/src/internal/core/configuration-variables.ts`) — a `.env` file loaded via `import "dotenv/config"` at the top of the config/script still works, no keystore setup required.
- Standalone scripts (run via `hardhat run scripts/x.js --network <net>`) get a network connection via `const { ethers, networkName } = await network.create();` (`import { network } from "hardhat"`) — NOT a global `hre.ethers`. `network.create()` automatically respects the `--network` flag.
- Bundled reference docs ship inside the installed package at `node_modules/hardhat/skills/hardhat/SKILL.md` and `node_modules/hardhat/skills/hardhat-toolbox-mocha-ethers/SKILL.md` — check these first before searching the web, they're versioned to match whatever Hardhat is actually installed.
- The old Hardhat 2 top-level `sourcify: { enabled: false }` config field has no Hardhat 3 equivalent and should just be dropped — `hardhat-verify` (bundled in the toolbox) never auto-attempts Sourcify verification, so there's nothing to silence.
- `npm run compile` now also generates `types/ethers-contracts/` (TypeChain bindings, bundled with the toolbox even for a plain-JS project). This is gitignored alongside `artifacts/`/`cache/` — treat it as fully regenerated, never commit it.
- `npm run compile` printing `No contracts to compile` is **normal Hardhat 3 behavior**, not an error: it fires whenever every discovered `.sol` file already has a valid cache hit for the current build profile (`runnableCompilationJobs.length === 0` in `hardhat`'s build system). It does not mean contracts weren't found. Confirm the build is actually up to date by checking `artifacts/contracts/**/*.json` exists; if you specifically want to force a full rebuild (e.g. after a compiler/plugin change), run `npx hardhat clean && npm run compile` — both `artifacts/` and `cache/` are gitignored and fully regenerable. (A leftover Hardhat-2-only `cache/solidity-files-cache.json` was initially — and wrongly — suspected as the cause in ADR 0009; Hardhat 3 never reads that file. See ADR 0010 for the corrected diagnosis.)
