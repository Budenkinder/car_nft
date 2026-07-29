# ADR 0018: Compensating unpin when on-chain mint fails after a successful IPFS pin

- **Status:** accepted
- **Date:** 2026-07-26
- **Scope:** frontend
- **Related plans:**
  - `docs/plans/done/0018-unpin-ipfs-on-mint-failure-frontend.md`
  - `docs/plans/done/0018-unpin-ipfs-on-mint-failure-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-26-011-unpin-ipfs-on-mint-failure.md`

## Context

`handleNFTCreation` ([frontend/src/utils/pinata_ipfs_nft_service.js:135-234](../../frontend/src/utils/pinata_ipfs_nft_service.js#L135-L234)) does two sequential writes to two different systems with no atomicity between them:

1. Pin the car's metadata JSON to IPFS via Pinata (`pinJSONToIPFS`) — succeeds, returns a CID.
2. Call `VinCidRegistry.storeCid(vin, cid, recipient)` on-chain via MetaMask.

If step 2 throws — the user rejects the MetaMask signing prompt, the tx reverts (e.g. `Only minter can mint`), a network error, insufficient gas — execution falls into the single `catch` block at line 224, which just returns a failure. The pin from step 1 already happened and is never cleaned up: it sits in the Pinata account with a CID that no token, VIN registry entry, or `tokenURI` will ever reference. Every retry re-pins (each pin embeds a fresh `attributes.timestamp`, so it's always a new, distinct CID even for identical form data) and leaves the previous orphan behind — orphaned pins accumulate one per failed attempt.

The contract side is not at fault here: `storeCid` is atomic (all state changes happen together or the whole call reverts — see [contracts/car_nft_sc.sol:49-77](../../contracts/car_nft_sc.sol#L49-L77)). The gap is purely in the frontend's two-step orchestration across systems that can't share a transaction.

## Decision

Wrap the on-chain `storeCidOnBlockchain` call in its own `try/catch` inside `handleNFTCreation`. On failure, issue a compensating "unpin" request to Pinata (`DELETE {PINATA_BASE}/unpin/{cid}`) for the CID that was just pinned, best-effort (log if the unpin itself fails, but always propagate the original mint error to the caller — never mask it with an unpin failure). This is the standard compensating-transaction (saga) pattern for a write that spans two non-transactional systems: since we can't make the pin and the mint atomic, we detect the failure and roll back the side effect we control.

No change to the pin step itself, no contract changes, and no attempt to reuse a CID across retries (rejected — see Alternatives).

## Options Considered

### Option A — Compensating unpin on mint failure (chosen)
- **Pros:** Directly fixes "orphaned entry with no connection to a token" — self-healing, no manual Pinata dashboard cleanup needed. Small, localized change (one new function, one added try/catch). Works uniformly for both new-mint and update-CID failures.
- **Cons:** Best-effort only — if the unpin call itself fails (network blip, JWT lacking unpin scope), the orphan still exists. Requires the configured Pinata JWT to carry unpin permission (see Consequences).

### Option B — Reuse the same CID across retries instead of unpinning
- **Pros:** Avoids the extra unpin network call; avoids ever creating a second pin for a failed attempt in the first place.
- **Cons:** Requires threading pinned-but-unminted state through the UI (store `{ cid, carData }` in component state, add a distinct "retry mint" path that skips re-pinning) — meaningfully larger frontend change for a narrower win. Doesn't help if the user edits the form before retrying (new content is correct/desired there, so a stale CID would be wrong). Deferred; could be layered on top of Option A later if unpin reliability turns out to be a problem in practice.

### Option C — Remove `attributes.timestamp` so identical resubmits hash to the same CID
- **Pros:** IPFS content-addressing would naturally dedupe identical retries.
- **Cons:** Rejected — `timestamp` is semantically meaningful for the **update** path (each repair-history update is supposed to produce a distinct CID representing a new point-in-time record, per the contract's own doc comment: "Updating a record rewrites the NFT's URI in place"). Removing it would break intentional update versioning to fix a problem that only exists in the failure path.

## Consequences

- **Positive:** A failed mint no longer leaves a permanent, disconnected IPFS entry. Retrying after a failure starts clean.
- **Negative:** Relies on the configured `REACT_APP_PINATA_JWT` having unpin permission — if it's scoped to pin-only, the compensating call will itself fail (logged, not surfaced as a separate user-facing error). Worth a one-time check in the Pinata dashboard.
- **Frontend impact:** New `unpinFromIPFS(cid)` helper in `pinata_ipfs_nft_service.js`; `handleNFTCreation`'s mint call gets its own try/catch.
- **Contracts impact:** None — `storeCid` is already atomic; this ADR doesn't touch `contracts/`.
- **Follow-ups:** If unpin failures turn out to be common in practice (JWT scope, rate limits), revisit Option B (CID-reuse retry) as a complementary fix.

## References

- `frontend/src/utils/pinata_ipfs_nft_service.js:135-234` (`handleNFTCreation`)
- `contracts/car_nft_sc.sol:49-77` (`storeCid`)
- [Pinata unpin API](https://docs.pinata.cloud/api-reference/endpoint/unpin-file) — `DELETE /pinning/unpin/{CID}`
