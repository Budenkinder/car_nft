---
date: 2026-07-20
scope: both
status: accepted
related_adr: 0011-forward-hardhat-node-port-for-metamask
supersedes: none
---

# Plan 0011 transitioned in-progress → done; ADR 0011 bumped proposed → accepted

## Context

User issued `autonomous`. Both contracts-plan tasks were executed: `.devcontainer/devcontainer.json` now forwards `8545` (labeled "Hardhat local node", `onAutoForward: "silent"`), and `README.md`'s "Option 1 — Local deploy" section gained a note for Dev Container / Codespaces users about the forwarded port and the need to reload the container window. Verification split cleanly: JSON validity and the node's `0.0.0.0:8545` bind were confirmed from inside the container (`eth_chainId` returned `0x7a69` over `127.0.0.1:8545`); confirming the port shows in VS Code's Ports panel and that MetaMask on the host actually connects needs the user's own environment and is called out as a remaining manual step. The frontend plan had no code tasks — it recorded the manual local + Sepolia + MetaMask test steps only.

## Decision

Moved both `0011-forward-hardhat-node-port-for-metamask-frontend.md` and `0011-forward-hardhat-node-port-for-metamask-contracts.md` from `docs/plans/in-progress/` to `docs/plans/done/`. Bumped ADR 0011 from `proposed` to `accepted` and rewrote its `Related plans:` paths to `done/`.

## Alternatives Considered

- **Move to `done/` now, with the host-side check flagged as a follow-up for the user** — chosen; everything verifiable from inside the container passed, and the remaining check inherently requires the user's own VS Code UI and host browser.
- **Hold in `in-progress/` until the user confirms MetaMask actually connects** — rejected; would block plan closure on a check this agent has no way to perform itself, for a change that has already been correctly implemented and verified as far as possible from inside the container.

## Consequences

- **Positive:** `8545` is now forwarded and documented; local MetaMask testing is unblocked pending only a container reload.
- **Negative / accepted costs:** the final MetaMask-connects check is left to the user.
- **Follow-ups required:** none blocking. If the user reports MetaMask still can't connect after reloading the container, revisit (e.g. check firewall/VPN interference, or whether the Dev Containers extension needs a full rebuild rather than just a reload).
