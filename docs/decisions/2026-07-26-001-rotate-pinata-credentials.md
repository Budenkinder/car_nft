---
date: 2026-07-26
scope: frontend
status: accepted
related_adr: 0014-rotate-pinata-credentials
supersedes: none
---

## Context

User generated a new Pinata API Key, API Secret, and scoped JWT and asked for the project's configs to be updated. The values were pasted in plaintext into the chat conversation.

## Decision

Update only `REACT_APP_PINATA_JWT` in the gitignored `frontend/.env.local`, since that is the only credential of the three actually consumed by the codebase (`frontend/src/utils/pinata_ipfs_nft_service.js:177`). Do not record the raw API Key/Secret anywhere in the repo — no code reads them, and adding unused config would be dead weight. Do not write any of the three secret values into ADR/plan/decision-log/memory files, since those are git-tracked.

## Alternatives considered

- Add `PINATA_API_KEY` / `PINATA_API_SECRET` as new env vars for completeness — rejected, no reader exists for them, and it would expand the secret surface without functional benefit.
- Skip config updates and only flag the chat-paste exposure — rejected, contradicts the user's explicit request.

## Consequences

- `frontend/.env.local` now holds the rotated JWT (gitignored, not committed).
- Flagged to the user: the pasted secrets are now present in this conversation's transcript; treat the old key/JWT as exposed and revoke it in the Pinata dashboard once the new one is confirmed working, and avoid pasting live secrets into chat in future turns.
- No contracts-side consequence.
