# Plan 0019 — Keep the local Hardhat node alive across terminal restarts — Contracts

- **ADR:** `docs/adr/0019-persistent-local-hardhat-node.md`
- **Paired plan:** `docs/plans/draft/0019-persistent-local-hardhat-node-frontend.md`
- **Status:** draft
- **Date:** 2026-07-28

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Run `hardhat node` as a detached background process owned by the Dev Container's `postStartCommand` instead of a foreground child of whichever terminal happens to start it, so the local chain (and anything deployed on it) survives closing and reopening terminals within the same container session. Add matching `npm run` scripts to check logs and force a fresh chain on demand.

**Out of scope:** true disk persistence surviving a full container rebuild/restart (ADR 0019 Option B, deferred — would require adopting Foundry Anvil, a separate toolchain not installed here); any change to `contracts/*.sol`, `hardhat.config.js`, or `scripts/deploy.js`.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `.devcontainer/start-hardhat-node.sh` | add | Idempotent: no-ops if something already answers JSON-RPC on `:8545`; else launches `hardhat node` fully detached (`setsid nohup ... &`), writes a pidfile, waits for readiness. Guards against missing root `node_modules`. |
| `.devcontainer/stop-hardhat-node.sh` | add | Kills the process via the pidfile; explicit that chain state is gone once stopped. |
| `.devcontainer/devcontainer.json` | modify | Add `"postStartCommand": "bash .devcontainer/start-hardhat-node.sh"`. |
| `package.json` | modify | Add `node:bg`, `node:stop`, `node:logs` scripts. Existing `node` script (foreground) is unchanged. |
| `README.md` | modify | Document the new default (node auto-starts in the background on container start) and the manual controls (`node:logs`, `node:stop`, `node:bg`). |
| `docs/memory/contracts/hardhat-node-persistence-approach.md` | add | Memory: why a background process was chosen over Anvil disk persistence, and the terminal-vs-container-rebuild boundary. |
| `docs/memory/MEMORY.md` | modify | Index line for the new memory file. |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [ ] **1.** Create `.devcontainer/start-hardhat-node.sh`:
  - `set -euo pipefail`; `cd "$(dirname "$0")/.."` to reach the repo root.
  - Define `PIDFILE=/tmp/hardhat-node.pid`, `LOGFILE=/tmp/hardhat-node.log`, `RPC_URL=http://127.0.0.1:8545`.
  - `is_node_up()` helper: `curl -s -o /dev/null -m 2 -X POST "$RPC_URL" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'`.
  - If `is_node_up` succeeds: print "already running" and exit 0 (idempotency — do not spawn a second node).
  - If `node_modules/hardhat` is missing at repo root: print a clear message ("root dependencies not installed — run `npm install` at repo root first") to both stdout and `$LOGFILE`, exit 1. (Root `npm install` isn't currently automated — see the known gap tracked in plan 0013 — so fail fast with an actionable message instead of an opaque `npx` error.)
  - Else: `setsid nohup npx hardhat node > "$LOGFILE" 2>&1 < /dev/null & echo $! > "$PIDFILE"; disown`.
  - Poll `is_node_up` once per second for up to 30s; print "ready (PID …)" and exit 0 once it responds, or print a timeout error pointing at `$LOGFILE` and exit 1 if it never comes up.
  - `chmod +x .devcontainer/start-hardhat-node.sh`.
- [ ] **2.** Create `.devcontainer/stop-hardhat-node.sh`:
  - Read `PIDFILE=/tmp/hardhat-node.pid`; if absent, print "no pidfile — node may not be running under this script" and exit 1.
  - If the PID is alive (`kill -0`), `kill` it and print "stopped — chain state is gone; redeploy with `npm run deploy:local` next time you start it."
  - If not alive, print "stale pidfile, removing."
  - `rm -f "$PIDFILE"` in both cases. `chmod +x .devcontainer/stop-hardhat-node.sh`.
- [ ] **3.** Update `.devcontainer/devcontainer.json`: add `"postStartCommand": "bash .devcontainer/start-hardhat-node.sh"` (fires on every container start, not just creation — distinct from the existing `postCreateCommand`, which is left untouched).
- [ ] **4.** Update `package.json` scripts: add `"node:bg": "bash .devcontainer/start-hardhat-node.sh"`, `"node:stop": "bash .devcontainer/stop-hardhat-node.sh"`, `"node:logs": "tail -f /tmp/hardhat-node.log"`. Leave the existing `"node": "hardhat node"` script as-is for manual foreground use.
- [ ] **5.** Update `README.md`'s local-node section: the node now auto-starts in the background when the Dev Container starts (no need to manually run `npm run node` inside the container anymore); note `npm run node:logs` to tail output, `npm run node:stop` to force a fresh chain, `npm run node:bg` to bring it back up without waiting for a container restart. Call out explicitly that state survives closing/reopening terminals but **not** a full container rebuild — at that point `npm run deploy:local` is the same cheap fallback as before.
- [ ] **6.** Create `docs/memory/contracts/hardhat-node-persistence-approach.md` and add its index line to `docs/memory/MEMORY.md`.

## Contract Surface

- No changes. `contracts/car_nft_sc.sol` and `contracts/car_reward_token.sol` are untouched — this plan is Dev Container process-lifecycle tooling only.

## Interfaces with Frontend

- None new. `scripts/deploy.js`'s existing write of the deployed address to `frontend/.env.local` (and the ABI to `contract_abi.json`) is unaffected — the frontend has no visibility into how the node process is started or stopped.

## Testing

- **Fresh start:** rebuild/reopen the container, confirm the `postStartCommand` log shows the node starting and `curl -X POST http://127.0.0.1:8545 -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'` responds.
- **Deploy once, then survive a terminal close:** run `npm run deploy:local`, note the printed `VinCidRegistry` address. Close the integrated terminal, open a new one, and confirm the same address still returns code (e.g. `npx hardhat run` a one-off script calling `provider.getCode(address)`, or check via the frontend) — proves state survived the terminal restart without redeploying.
- **Idempotency:** run `npm run node:bg` while the node is already up; confirm it logs "already running" and does not spawn a second process (`ps` shows only one `hardhat node`).
- **Stop actually clears state:** run `npm run node:stop`, confirm `curl` to `:8545` now fails, run `npm run node:bg` again, and confirm the previously-deployed contract address no longer has code — validates the stop path genuinely resets the chain rather than leaving something running unnoticed.
- **Missing root deps guard:** temporarily rename root `node_modules`, run `npm run node:bg`, confirm it fails fast with the actionable message rather than a raw `npx` stack trace; restore `node_modules` afterward.

## Deployment and Migration

- Not applicable — Dev Container tooling only, no on-chain migration. Takes effect the next time the Dev Container is started or rebuilt (or immediately via `npm run node:bg` in an already-running container).

## Risks and Rollback

- **Risk:** root `node_modules` may not be installed automatically yet (open gap tracked separately in plan 0013's "Open Questions") — mitigated by the guard in task 1 failing fast with a clear message instead of a confusing `npx` error.
- **Risk:** `/tmp/hardhat-node.pid` and `/tmp/hardhat-node.log` are wiped on container rebuild — harmless, since the node process itself is gone at that point too and the script starts clean.
- **Risk:** if a developer manually kills the backgrounded `hardhat node` process outside of `npm run node:stop` (e.g. `pkill`), the pidfile goes stale; the next `node:bg` run's `is_node_up` check still correctly detects "not running" and starts a fresh one, so this self-heals.
- **Rollback:** remove the `postStartCommand` line from `devcontainer.json`, delete the two new scripts and the three new `package.json` script entries. `npm run node` (foreground) is untouched throughout and keeps working exactly as before.

## Open Questions

- Now that `node:bg` exists, should the old foreground `npm run node` script be renamed (e.g. to `node:fg`) to make the distinction obvious, or left as-is since it's still a valid way to run the node manually outside the Dev Container? Leaving it as-is for now — flagging in case it reads as confusing once both exist side by side.
