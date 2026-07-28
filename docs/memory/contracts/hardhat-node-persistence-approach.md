---
name: hardhat-node-persistence-approach
description: Local Hardhat node runs as a detached background process (postStartCommand) to survive terminal restarts — not disk-persisted, and not Foundry Anvil.
metadata:
  type: project
  scope: contracts
---

The local `hardhat node` is launched as a `setsid`-detached background process from `.devcontainer/devcontainer.json`'s `postStartCommand` (`.devcontainer/start-hardhat-node.sh`), idempotent against re-runs. This makes the chain (and anything deployed on it) survive closing and reopening terminals within the same Dev Container session — `npm run node:stop` / `npm run node:bg` control it manually, `npm run node:logs` tails its output.

**Why:** Hardhat 3's EDR network backend has no state-save/load mechanism — confirmed directly: `npx hardhat node --help` lists no state flag, and `@nomicfoundation/edr`'s `index.d.ts` has no `dumpState`/`loadState` (unlike Hardhat 2's `hardhat_dumpState`/`hardhat_loadState`, or Foundry Anvil's `--state <file>`). True disk persistence surviving a full container rebuild would require adopting Anvil as a new toolchain (see [[persistent-local-hardhat-node]] ADR 0019, Option B) — deferred because the actual friction reported was terminal-scoped, not rebuild-scoped. See `docs/adr/0019-persistent-local-hardhat-node.md`.

**How to apply:** State survives terminal open/close but is still lost on a genuine container rebuild/restart — at that point `npm run deploy:local` (already cheap, auto-syncs `frontend/.env.local` and the ABI) remains the fallback, same as before this change. If a future request needs state to survive container rebuilds too, that's Option B (Foundry Anvil `--state`) from ADR 0019, not this mechanism.
