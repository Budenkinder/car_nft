# Plan 0018 — Unpin IPFS entry on mint failure — Frontend

- **ADR:** `docs/adr/0018-unpin-ipfs-on-mint-failure.md`
- **Paired plan:** `docs/plans/done/0018-unpin-ipfs-on-mint-failure-contracts.md`
- **Status:** done
- **Date:** 2026-07-26

## Scope and Goals

Fix the orphaned-IPFS-pin bug: when `storeCidOnBlockchain` fails after `handleNFTCreation` has already pinned metadata to IPFS, unpin that CID as a compensating action instead of leaving it permanently disconnected from any token. Out of scope: reusing a CID across manual retries (ADR 0018 Option B, deferred), and any change to the pin step itself or to `attributes.timestamp`.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/utils/pinata_ipfs_nft_service.js` | modify | Add `unpinFromIPFS(cid)` helper; wrap the `storeCidOnBlockchain` call (currently lines 207-212) in its own try/catch that calls it on failure before re-throwing. |

## Tasks

- [x] **1.** Add a private `unpinFromIPFS(cid)` async helper: `DELETE ${PINATA_BASE}/unpin/${cid}` with the same `Authorization: Bearer ${process.env.REACT_APP_PINATA_JWT}` header used for pinning. Wrap its own body in try/catch — never let an unpin failure throw out of this helper; log success/failure via `netLog` (`pinata:unpin:done` / `pinata:unpin:failed`) and return a boolean.
- [x] **2.** In `handleNFTCreation`, wrap the existing `const txHash = await storeCidOnBlockchain(...)` call (lines 207-212) in its own `try { ... } catch (mintError) { await unpinFromIPFS(result.IpfsHash); throw mintError; }` so the outer catch block still receives and returns the original mint error to the caller — the unpin is silent cleanup, not a replacement error path.
- [x] **3.** Confirm via manual test (see Testing below) that the orphan is actually removed from the Pinata dashboard after a simulated mint failure, and that a genuine mint success still returns normally with no unpin call made. Confirmed by the user outside this environment (real browser + MetaMask + live Pinata account).

## Interfaces with Contracts

- No new contract calls. Still calls `storeCid(vin, cid, recipient)` exactly as before — only the frontend's handling of that call's failure changes.

## Testing

- Manual: temporarily point `getContractAddress` at an address with no deployed contract (or disconnect the local Hardhat node) so `storeCidOnBlockchain` throws, submit the "Create NFT" form, and confirm:
  - The pin still appears briefly, then is removed — check the Pinata dashboard (or call Pinata's list-pins API) for the CID immediately after the failure and confirm it's gone.
  - The UI still surfaces the original mint error message (not an unpin-related message).
- Manual: run the happy path (successful mint) and confirm behavior is unchanged — no unpin call is made, `netLog` shows no `pinata:unpin:*` entries.
- No automated test suite currently covers this file; manual verification remains the standard here (consistent with the rest of this integration).

## Risks and Rollback

- Risk: if `REACT_APP_PINATA_JWT` lacks unpin permission, the compensating call itself will fail (401/403) — logged via `netLog.warn`/`error`, not surfaced to the user as a second error. Worth confirming the JWT's scope in the Pinata dashboard includes unpin/delete.
- Risk: a genuine network partition between the unpin call and Pinata could still leave an orphan in rare cases — accepted as inherent to a best-effort compensating action; not fully solvable without transactional semantics across both systems.
- Rollback: revert the `pinata_ipfs_nft_service.js` change; no state migration needed since this only affects future write attempts.

## Open Questions

None.
