---
date: 2026-07-28
scope: contracts
status: accepted
related_adr: 0019-persistent-local-hardhat-node
supersedes: none
---

# Run the local Hardhat node as a container-lifecycle background process, not via Foundry Anvil disk persistence

## Context

The user wants a locally deployed contract to stay reachable for manual testing across closing and reopening terminals — today `npm run node` is a foreground process tied to one terminal's lifetime, so closing that terminal kills the chain and forces a redeploy. Checked the installed toolchain directly: `npx hardhat node --help` has no state-save/load flag, and `@nomicfoundation/edr` (Hardhat 3's network backend) exposes no `dumpState`/`loadState` equivalent to Hardhat 2's `hardhat_dumpState`/`hardhat_loadState`. True disk-persisted state isn't available from Hardhat itself in this version.

## Decision

Chosen: detach `hardhat node` from any individual terminal by launching it from `.devcontainer/devcontainer.json`'s `postStartCommand` as a `setsid`-detached background process, idempotent against being re-run. This solves the terminal-close/reopen case (the actual reported friction) without adding a new toolchain. State still resets on a full container rebuild — accepted, since `npm run deploy:local` already makes that cheap and it's a much rarer event than closing a terminal.

## Alternatives Considered

- **Detached background process via `postStartCommand` (chosen)** — fixes the reported symptom, zero new dependencies, small and reversible.
- **Foundry Anvil with `--state <file>`** — gives real disk persistence surviving container rebuilds too, but requires installing Foundry (new devcontainer feature, container rebuild) for a broader guarantee than what was actually asked for. Deferred as a follow-up ADR if terminal-scoped persistence proves insufficient.
- **Ganache with `--database.dbPath`** — also disk-persists, but legacy tooling with no advantage over Anvil; rejected outright.
- **Status quo (redeploy every time)** — zero effort, but is exactly the friction the user asked to remove.

## Consequences

- **Positive:** Contracts deployed for manual testing survive terminal restarts within a container session; no new toolchain; fully reversible.
- **Negative / accepted costs:** Does not survive a full container rebuild/restart — that boundary still requires a redeploy, same as before this change.
- **Follow-ups required:** `.devcontainer/start-hardhat-node.sh` and `.devcontainer/stop-hardhat-node.sh` (plan 0019, contracts side); README update; memory file documenting the terminal-vs-rebuild persistence boundary. If cross-rebuild persistence is later needed, open a new ADR for adopting Foundry Anvil.
