# Plan 0011 — Forward the local Hardhat node's port for MetaMask — Contracts

- **ADR:** `docs/adr/0011-forward-hardhat-node-port-for-metamask.md`
- **Paired plan:** `docs/plans/done/0011-forward-hardhat-node-port-for-metamask-frontend.md`
- **Status:** done
- **Date:** 2026-07-20

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Forward port `8545` (the local Hardhat node's JSON-RPC endpoint) from the dev container to the host, so MetaMask — running in the user's host browser — can reach `npm run node` running inside the container. This is the one confirmed blocker to testing the frontend against a locally deployed contract with MetaMask; local deploy and Sepolia deploy already work with no code changes needed (see ADR 0011's Context).

Out of scope: any change to `hardhat.config.js`, `scripts/deploy.js`, or `contracts/*.sol` — none are implicated. Also out of scope: actually running `npm run deploy:sepolia` as part of verification — that spends real testnet funds and is left for the user to run when ready.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `.devcontainer/devcontainer.json` | modify | Add `8545` to `forwardPorts`; add a `portsAttributes["8545"]` entry (label + `onAutoForward: "silent"`). |
| `README.md` | modify | One-line note in "Option 1 — Local deploy" that Dev Container / Codespaces users need `8545` forwarded (and may need to reload the container window after a `devcontainer.json` change) for MetaMask to reach the local node. |

## Tasks

Execute in order. Each task should be small enough to implement and review independently.

- [x] **1.** Add `8545` to `.devcontainer/devcontainer.json`'s `forwardPorts` array, and a matching `portsAttributes` entry: `{ "label": "Hardhat local node", "onAutoForward": "silent" }`.
- [x] **2.** Add a short note to `README.md`'s "Option 1 — Local deploy" section, next to the existing MetaMask network-setup steps, stating that Dev Container / Codespaces users need port `8545` forwarded (already configured after this change) and may need to reload the container window for a fresh `devcontainer.json` to take effect if the container was already running.
- [x] **3.** Verification split between what's verifiable in-container vs. what needs the user's host/VS Code UI:
  - Verified in-container: `.devcontainer/devcontainer.json` is valid JSON; `npm run node` binds to `0.0.0.0:8545` (not just `127.0.0.1`, which is required for forwarding to work) — confirmed via log output `Started HTTP and WebSocket JSON-RPC server at http://0.0.0.0:8545/`; a JSON-RPC call (`eth_chainId`) against `http://127.0.0.1:8545` from inside the container returned `0x7a69` (31337) as expected.
  - Still needs the user: reload the container window (or rebuild) so VS Code picks up the new `forwardPorts` entry, confirm `8545` appears in VS Code's Ports panel, then add the Hardhat network to MetaMask on the host and confirm it connects. This step needs the user's own VS Code UI and host-side MetaMask — not something verifiable from inside the container.

## Contract Surface

No changes — `contracts/car_nft_sc.sol` and `contracts/car_reward_token.sol` untouched.

## Interfaces with Frontend

None new — `frontend/src/utils/contract_utils.js`'s existing `"0x7a69"` (31337) → `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` mapping and `scripts/deploy.js`'s existing auto-write to `frontend/.env.local` are unchanged and already sufficient once the port is reachable.

## Testing

- Manual (task 3 above): confirm MetaMask on the host can connect to the local Hardhat node through the forwarded port.
- No automated tests apply to a dev-container config change.

## Deployment and Migration

- Not applicable — no on-chain or deploy-script change.
- Sepolia deploy/testing is unaffected by this plan and is not re-run here (real funds); the user can run `npm run deploy:sepolia` independently at any time using the already-configured `.env`.

## Risks and Rollback

- **Risk:** a currently-running dev container may not pick up the `devcontainer.json` change without a window reload or full rebuild. Mitigation: task 2's README note calls this out explicitly.
- **Rollback:** revert the `.devcontainer/devcontainer.json` and `README.md` diffs; no on-chain or application state is affected either way.

## Open Questions

None.
