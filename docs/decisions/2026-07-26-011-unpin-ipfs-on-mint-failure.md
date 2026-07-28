---
date: 2026-07-26
scope: frontend
status: accepted
related_adr: 0018-unpin-ipfs-on-mint-failure
supersedes: none
---

## Context

User reported a bug: when `handleNFTCreation` pins car metadata to IPFS successfully but the subsequent on-chain `storeCid` call fails, the IPFS entry is never cleaned up — it's orphaned, disconnected from any token, and every retry creates another orphan (each pin embeds a fresh `timestamp`, so it's always a distinct CID).

## Decision

Fix via a compensating unpin: wrap the mint call in `handleNFTCreation` in its own try/catch, and on failure call a new `unpinFromIPFS(cid)` helper (best-effort, `DELETE {PINATA_BASE}/unpin/{cid}`) before re-throwing the original mint error. Rejected removing `attributes.timestamp` to make retries content-addressed/idempotent, since timestamp is semantically required for the update path (each repair-history update should get its own distinct CID) — that would fix the failure-path symptom by breaking an intentional feature. Rejected CID-reuse-on-retry (Option B in ADR 0018) as a larger UI-state change for a narrower win; can be layered on later if best-effort unpin proves insufficient.

## Alternatives considered

- Remove `timestamp` from pinned content for content-addressed idempotency — rejected, breaks intentional update-versioning semantics.
- Thread pinned-CID state through the UI to support a "retry mint without re-pinning" path — deferred as a larger change; not needed if unpin reliably cleans up failures.

## Consequences

- A failed mint no longer leaves a permanent orphaned IPFS entry.
- Depends on the configured Pinata JWT having unpin permission — flagged as a risk in the frontend plan, to be confirmed during implementation/testing.
- No contracts changes.
