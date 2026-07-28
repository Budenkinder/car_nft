---
name: pinata-jwt-only-credential
description: Only REACT_APP_PINATA_JWT is consumed by the frontend; Pinata API Key/Secret have no reader in this codebase
metadata:
  type: project
  scope: frontend
---

The frontend authenticates to Pinata solely via `Authorization: Bearer ${process.env.REACT_APP_PINATA_JWT}` in `frontend/src/utils/pinata_ipfs_nft_service.js`. There is no env var or code path anywhere in the repo that reads a raw Pinata API Key or API Secret (the scoped JWT already encodes that key/secret pair).

**Why:** Confirmed while rotating Pinata credentials ([ADR 0014](../../adr/0014-rotate-pinata-credentials.md)) — the user provided a new API Key + Secret + JWT, but only the JWT had anywhere to go in `frontend/.env.local`.

**How to apply:** If a future request asks to configure a Pinata API Key/Secret, that implies adding a *new* auth path (e.g. legacy key/secret headers) — it's not an oversight in existing config, and needs its own ADR/plan rather than just dropping values into `.env.local` under a guessed variable name.
