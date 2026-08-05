---
name: fresh-container-env-files-not-scaffolded
description: Nothing creates .env or frontend/.env.local on a fresh Codespace/container rebuild — both sides fail silently; the fix (plan 0013) is approved but unstarted.
metadata:
  type: project
  scope: contracts
---

`.devcontainer/devcontainer.json`'s `postCreateCommand` is only `cd frontend && npm install`. On a fresh clone, new Codespace, or container rebuilt from scratch, **neither** root `.env` (Hardhat) nor `frontend/.env.local` (CRA) exists, and nothing creates them from their `.example` templates.

Both sides then fail **silently**, not loudly:

- `hardhat.config.js` simply omits the `sepolia` network when `SEPOLIA_RPC_URL` / `DEPLOYER_PRIVATE_KEY` are undefined — no error, the network just isn't there.
- The frontend renders "no contract configured" banners rather than reporting a missing env var.

**Why:** ADR 0013 proposes fixing this with a `.devcontainer/setup.sh` copy-if-absent scaffold. Trio 0013 has been **approved but unstarted since 2026-07-23** — ADR 0008 deferred the same gap before that. On 2026-08-02 the user rejected the plan and then reverted the rejection within the same session (`docs/decisions/2026-08-02-006` → `2026-08-02-007`, no reason given either way), so it is back in `docs/plans/approved/`, tracked by [#41](https://github.com/Budenkinder/car_nft/issues/41). Treat its fate as unsettled: don't assume it will ship, and don't re-pitch it unprompted.

**How to apply:** if someone reports Hardhat "losing" the Sepolia network or the UI showing no contract on a fresh environment, check for the missing env files first — that is the likeliest cause, and copying from `.env.example` / `frontend/.env.example` by hand is the current answer until plan 0013 is implemented. ADR 0013 is still `proposed` — a plan's status never moves its ADR.

Unaffected by the rejection: the plaintext Pinata JWT rotation, which is tracked by its own draft trio 0014 — see [[pinata-jwt-only-credential]].
