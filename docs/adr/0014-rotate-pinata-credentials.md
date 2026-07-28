# ADR 0014: Rotate Pinata IPFS credentials

- **Status:** accepted
- **Date:** 2026-07-26
- **Scope:** frontend
- **Related plans:**
  - `docs/plans/draft/0014-rotate-pinata-credentials-frontend.md`
  - `docs/plans/draft/0014-rotate-pinata-credentials-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-26-001-rotate-pinata-credentials.md`

## Context

The user generated a new Pinata API Key, API Secret, and scoped JWT and asked that the project's configs be updated to use them. The new credential values were pasted directly into chat in plaintext, which means they are now present in this conversation's transcript/logs in addition to whatever secret store Pinata itself uses. That is a real exposure surface independent of anything in this repo — this ADR does not attempt to remediate that, it only covers rotating the repo-side config.

Only one of the three new secrets is actually consumed by this codebase: `frontend/src/utils/pinata_ipfs_nft_service.js:177` sends `Authorization: Bearer ${process.env.REACT_APP_PINATA_JWT}` for `pinJSONToIPFS` calls. There is no code path anywhere in `frontend/` or `contracts/` that reads a Pinata API Key or API Secret directly (Pinata's JWT already encodes the scoped key/secret pair, so the legacy key/secret headers are unused here). `frontend/.env.local` is gitignored (`.gitignore` explicitly calls out keeping `PINATA_JWT` out of the committed build), so this is a local/deployment config update, not a code change.

## Decision

Update `REACT_APP_PINATA_JWT` in the gitignored `frontend/.env.local` to the new JWT value. Do not add config entries for the raw API Key/Secret since nothing in the codebase reads them under any existing or documented env var name. No contracts-side changes are needed — Hardhat/deploy tooling has no Pinata dependency.

## Options Considered

### Option A — Update `REACT_APP_PINATA_JWT` in `.env.local` only (chosen)
- **Pros:** Matches the single actual call site; no dead config added; keeps the gitignored file as the only place the secret lives locally.
- **Cons:** The raw API Key/Secret the user generated go unused in this repo (expected — Pinata's JWT flow supersedes them for this integration).

### Option B — Also add `PINATA_API_KEY` / `PINATA_API_SECRET` env vars "for completeness"
- **Pros:** Preserves all three generated values somewhere.
- **Cons:** Dead config with no reader; violates the "don't add config for hypothetical future use" guidance; expands the secret surface for no functional benefit.

### Option C — Leave values in this chat only, don't touch files
- **Pros:** None specific to this request.
- **Cons:** Directly contradicts the user's request to update the configs.

## Consequences

- **Positive:** The app will authenticate to Pinata with the newly rotated JWT going forward; old JWT can be safely revoked in the Pinata dashboard.
- **Negative:** The API Key/Secret are recorded nowhere in the repo (by design) — if a future feature needs Pinata's key/secret auth mode instead of JWT, that will require its own ADR/plan when it happens.
- **Frontend impact:** `frontend/.env.local` updated; no code changes required since `pinata_ipfs_nft_service.js` already reads `process.env.REACT_APP_PINATA_JWT`.
- **Contracts impact:** None.
- **Follow-ups:** User should revoke the old Pinata key/JWT pair from the Pinata dashboard now that it's been rotated, and treat the value pasted into this chat as seen by a third party — avoid pasting live secrets into chat in future, prefer editing the `.env.local` file directly.

## References

- `frontend/.env.example`
- `frontend/src/utils/pinata_ipfs_nft_service.js`
