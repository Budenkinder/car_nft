# Plan 0014 — Rotate Pinata credentials — Frontend

- **ADR:** `docs/adr/0014-rotate-pinata-credentials.md`
- **Paired plan:** `docs/plans/draft/0014-rotate-pinata-credentials-contracts.md`
- **Status:** draft
- **Date:** 2026-07-26

## Scope and Goals

Update the local Pinata JWT used by the frontend to pin NFT metadata to IPFS, replacing it with the newly rotated value. Out of scope: adding config for the raw Pinata API Key/Secret (unused by any code path — see ADR 0014), and any change to Vercel's Project Environment Variables (user manages that separately if/when the deployed site also needs the new JWT).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/.env.local` | modify | Replace `REACT_APP_PINATA_JWT` value with the new rotated JWT. Gitignored — value never touches git history. |

## Tasks

- [ ] **1.** Update `REACT_APP_PINATA_JWT` in `frontend/.env.local` with the new JWT.
- [ ] **2.** Restart the CRA dev server (env vars are read at build/start time) and confirm no other `REACT_APP_PINATA_*` vars need changes.

## Interfaces with Contracts

- None. This is a client-side IPFS pinning credential; no contract call, event, or ABI is involved.

## Testing

- Manual: run `npm start` in `frontend/`, connect a wallet, submit the "create NFT" flow, and confirm `pinata:pin:done` appears in the console logger (from `netLog` in `pinata_ipfs_nft_service.js`) rather than a 401/403 from Pinata.
- No automated test suite covers this path currently; manual verification is the existing standard for this integration.

## Risks and Rollback

- Risk: if the new JWT lacks the same pin scopes as the old one, `pinJSONToIPFS` calls will 401/403 — verify scope in the Pinata dashboard if pinning fails after rotation.
- Rollback: revert `frontend/.env.local` to the previous JWT value (not tracked in git, so this must be done manually if the old value was saved elsewhere) or generate another new JWT in Pinata.

## Open Questions

- Does the deployed (Vercel) site also need this JWT updated in its Project Environment Variables? Not done as part of this plan — confirm with the user if the production/Sepolia deployment also needs rotation.
