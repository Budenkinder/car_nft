# ADR 0019: Keep the local Hardhat node alive across terminal restarts

- **Status:** accepted
- **Date:** 2026-07-28
- **Scope:** contracts
- **Related plans:**
  - `docs/plans/draft/0019-persistent-local-hardhat-node-frontend.md`
  - `docs/plans/draft/0019-persistent-local-hardhat-node-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-28-001-persistent-local-hardhat-node.md`

## Context

`npm run node` (`hardhat node`) runs in the foreground of whichever terminal starts it. Inside the Dev Container, closing that terminal kills the process — its in-memory chain, including any deployed `VinCidRegistry`/`CarRewardToken` instances, is gone. Opening a new terminal and running `npm run node` again starts a brand-new chain at block 0, so any contract deployed for manual testing has to be redeployed (`npm run deploy:local`) before the frontend or a Hardhat console session can talk to it again.

The user wants the deployed contract to stay reachable across that terminal churn so they can keep testing against it without redeploying every time they close and reopen a terminal.

Two persistence mechanisms were checked directly against the installed toolchain (Hardhat `^3.10.0`, `@nomicfoundation/edr` as its network backend) before deciding:

- `npx hardhat node --help` lists only `--chain-id`, `--chain-type`, `--fork`, `--fork-block-number`, `--hostname`, `--port` — no `--save`/`--load`/state-file flag.
- Searching the installed `hardhat` and `@nomicfoundation/*` packages (including `@nomicfoundation/edr`'s `index.d.ts`) for `dumpState`/`loadState` turned up nothing. Hardhat 2's `hardhat_dumpState`/`hardhat_loadState` JSON-RPC methods are not present in this Hardhat 3 / EDR network implementation.

So genuine disk-persisted chain state (surviving a full container rebuild, not just a closed terminal) is **not available** from Hardhat itself today. Achieving that would mean adopting a different local-chain tool — Foundry's Anvil supports `--state <file>` (auto dump-on-exit / load-on-start) — which isn't installed in this devcontainer and would require a container rebuild to add.

Re-reading the actual complaint, though, it's narrower than "state must survive a container rebuild": it's "state must survive me closing one terminal and opening another." That's a process-lifetime problem, not a disk-persistence problem — `hardhat node` only dies because it's a foreground child of that specific terminal's shell session.

## Decision

Run `hardhat node` as a detached background process owned by the Dev Container's lifecycle, not by any individual terminal. A new script, `.devcontainer/start-hardhat-node.sh`, launches it via `setsid nohup ... &` (fully detached from the calling shell's session, so it does not receive SIGHUP when a terminal closes), wired into `devcontainer.json`'s `postStartCommand` (fires once per container start, independent of how many terminals get opened/closed afterward). The script is idempotent — it first checks whether something is already answering JSON-RPC on `:8545` and, if so, leaves it alone rather than spawning a second node.

Net effect: as long as the Dev Container itself keeps running, the chain — and anything deployed on it — survives any number of terminal opens/closes. State is still lost on an actual container rebuild/restart, at which point the existing "redeploy is cheap" pattern (`npm run deploy:local`, which already auto-syncs the frontend) remains the fallback — same as today, just a rarer trigger than it used to be.

## Options Considered

### Option A — Detached background node, owned by the container's `postStartCommand` (chosen)
- **Pros:** Directly fixes the reported symptom (terminal close/reopen). No new toolchain, no container rebuild required beyond a `devcontainer.json` edit. Small, reversible, all-Hardhat.
- **Cons:** Does not survive a genuine container rebuild/restart — state is still ephemeral at that boundary. Requires a bit of process-management scaffolding (pidfile, log file, readiness poll) that Hardhat doesn't provide out of the box.

### Option B — Switch the local chain to Foundry's Anvil with `--state <file>`
- **Pros:** Real disk-persisted state, survives container rebuilds too, not just terminal churn. Industry-standard tool for exactly this.
- **Cons:** Foundry isn't installed in this devcontainer — adds a new toolchain, a devcontainer feature, and a rebuild. Bigger blast radius for a win the user's stated problem doesn't actually need yet. Left as a documented follow-up if Option A's narrower fix turns out insufficient.

### Option C — Ganache with `--database.dbPath`
- **Pros:** Also gives disk persistence.
- **Cons:** Legacy tooling (Truffle-era), no longer the recommended path for new work over Anvil; no advantage over Option B for more downside. Rejected outright.

### Option D — Do nothing; keep "redeploy every time" as the only pattern
- **Pros:** Zero new code.
- **Cons:** This is the status quo the user is explicitly asking to move past — redeploying after every closed terminal is exactly the friction they want removed.

## Consequences

- **Positive:** Contracts deployed for manual testing stay reachable across terminal restarts within a single container session. No new dependency added. Fully reversible by deleting the two new scripts and the `postStartCommand` line.
- **Negative:** State is still lost on a full container rebuild/restart — this ADR does not deliver true disk persistence. `hardhat node`'s existing behavior (and the `npm run node` script) is left untouched for anyone who wants the old foreground behavior.
- **Frontend impact:** None. The frontend already reads the deployed address from `frontend/.env.local`, written by `scripts/deploy.js`; it has no dependency on how the node process itself is started or stopped.
- **Contracts impact:** New Dev Container tooling only (`.devcontainer/start-hardhat-node.sh`, `.devcontainer/stop-hardhat-node.sh`, `postStartCommand`); no Solidity, `hardhat.config.js`, or `scripts/deploy.js` changes.
- **Follow-ups:** If terminal-scoped persistence turns out not to be enough in practice (e.g. the user also wants state to survive container rebuilds, or wants to snapshot/restore specific chain states for repeatable test scenarios), revisit Option B (Foundry Anvil) as its own ADR.

## References

- `npx hardhat node --help` output (checked directly against the installed `hardhat@3.10.0`) — no state-persistence flags.
- `@nomicfoundation/edr` package (`node_modules/@nomicfoundation/edr/index.d.ts`) — no `dumpState`/`loadState` exports.
- [Anvil `--state` flag docs](https://book.getfoundry.sh/reference/anvil/) — the disk-persistence mechanism Option B would use, for future reference.
- `.devcontainer/devcontainer.json` — current `postCreateCommand`/`forwardPorts` this ADR builds on top of (ADR 0011, ADR 0013).
