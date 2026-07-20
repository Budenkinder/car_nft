# ADR 0011: Forward the local Hardhat node's port so MetaMask can reach it from the host

- **Status:** accepted
- **Date:** 2026-07-20
- **Scope:** both
- **Related plans:**
  - `docs/plans/done/0011-forward-hardhat-node-port-for-metamask-frontend.md`
  - `docs/plans/done/0011-forward-hardhat-node-port-for-metamask-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-20-001-plan-0011-draft-to-in-progress.md`, `docs/decisions/2026-07-20-002-plan-0011-in-progress-to-done.md`

## Context

The user needs to: (1) deploy contracts locally, (2) deploy contracts to Sepolia, and (3) test the frontend end-to-end with MetaMask against a deployed contract — both locally and on Sepolia.

Checking each piece:

- **Local deploy** — already works (`npm run node` + `npm run deploy:local`), verified in ADR 0007/plan 0007.
- **Sepolia deploy** — already works; `.env` already has non-empty `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY` (values not inspected, only confirmed non-empty), and `ETHERSCAN_API_KEY` for `hardhat verify`.
- **Frontend ↔ Sepolia via MetaMask** — already works; `frontend/.env.local` already has a non-empty `REACT_APP_PINATA_JWT` (required for the IPFS pin step in `storeCid`'s write path), and MetaMask on the host reaches Sepolia directly over the internet — no dev-container-specific blocker.
- **Frontend ↔ local node via MetaMask** — **blocked**. As established earlier in this conversation, the browser (and MetaMask, a browser extension) run on the user's host machine, not inside the dev container; only a forwarded port bridges the two. `.devcontainer/devcontainer.json`'s `forwardPorts` currently lists only `3000` (the CRA dev server). The Hardhat node listens on `8545` inside the container — MetaMask on the host has no route to it until `8545` is also forwarded. This exactly matches the `ECONNREFUSED 127.0.0.1:8545` symptom already seen if `npm run node` is running but reached from an unforwarded port context (and would still block a correctly-running node from being reachable by a host-side MetaMask, once the "no node running" case is ruled out).

So the one concrete, missing piece is forwarding `8545` from the dev container to the host.

## Decision

Add `8545` to `.devcontainer/devcontainer.json`'s `forwardPorts`, with a `portsAttributes` entry labeled `"Hardhat local node"` and `onAutoForward: "silent"` (unlike port 3000, a JSON-RPC endpoint has no browser page worth auto-opening). Update `README.md`'s "Local deploy" instructions with a one-line note that Dev Container / Codespaces users need this port forwarded (already true once this ADR ships, but worth calling out since a running container may need a window reload to pick up a `devcontainer.json` change). No frontend or contract source code changes — `contract_utils.js`'s existing localhost chainId mapping and `deploy:local`'s existing auto-sync of `frontend/.env.local` already handle the rest.

## Options Considered

### Option A — Add `8545` to `forwardPorts` *(chosen)*
- **Pros:** matches exactly how port `3000` already works; zero frontend/contract code changes; the documented MetaMask setup steps in the README ("add the localhost network: RPC `http://127.0.0.1:8545`...") already assume this and will finally work as written.
- **Cons:** requires the user to reload/rebuild the running dev container for the `devcontainer.json` change to take effect.

### Option B — Run Hardhat node bound to `0.0.0.0` with manual `docker run -p` port mapping instead of VS Code's `forwardPorts`
- **Pros:** none specific to this setup — `hardhat node` already listens on `0.0.0.0:8545` inside the container by default (per `npm run node`'s script), so binding isn't the issue.
- **Cons:** this project doesn't manage its own `docker run` invocation — the Dev Container extension owns the container lifecycle, and `forwardPorts` is its supported mechanism (already used for port 3000). Bypassing it would be inconsistent and unnecessary.

### Option C — Tell the user to use `ngrok`/a tunneling tool instead of dev-container port forwarding
- **Pros:** would work.
- **Cons:** unnecessary extra tooling and a manual step every session, when the Dev Container's built-in `forwardPorts` does exactly this for free (as already proven by port 3000).

## Consequences

- **Positive:** the full documented local workflow (`npm run node` → `npm run deploy:local` → add Hardhat network to MetaMask → test in the frontend) becomes actually usable from a host-machine browser, matching what the README already describes.
- **Negative:** a running dev container needs a reload ("Dev Containers: Reload Window", or a rebuild if reload doesn't pick it up) after this change — one-time friction, not a recurring cost.
- **Frontend impact:** none — no code change; `contract_utils.js`'s existing `0x7a69` (31337) mapping and `deploy:local`'s existing `.env.local` auto-write already do everything needed once the port is reachable.
- **Contracts impact:** `.devcontainer/devcontainer.json` only; no Solidity, Hardhat config, or deploy-script change.
- **Follow-ups:** none anticipated. Sepolia deploy/testing needs no change and is not re-verified end-to-end here since it would spend real testnet funds — the user can run `npm run deploy:sepolia` themselves whenever they choose.

## References

- Earlier in this conversation: confirmation that the browser/MetaMask run on the host, and only forwarded ports bridge container ↔ host.
- `README.md` → "Option 1 — Local deploy (Hardhat, no Sepolia)" — the MetaMask network-setup steps this port forward finally makes usable.
