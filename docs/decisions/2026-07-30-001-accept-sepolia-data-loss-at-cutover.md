---
date: 2026-07-30
scope: contracts
status: accepted
related_adr: 0028-vin-registry-uups-proxy
supersedes: none
---

# Accept the current live Sepolia registry's data as a one-time loss at proxy cutover

## Context

ADR 0028 and plan 0028 (contracts) left one open question: since the currently-live Sepolia `VinCidRegistry` predates this change and isn't itself upgradeable, bootstrapping the new UUPS proxy on Sepolia necessarily starts with empty registry storage. The plan's task 10 asked the user to decide between writing a one-time migration script (replaying `getAllVins()`/`getAllCidsAsList()`/`ownerOf()` from the old contract into the new proxy) or accepting the loss.

## Decision

Accept the current live Sepolia registrations as a one-time loss. No migration script will be written. Task 10 in `docs/plans/in-progress/0028-vin-registry-uups-proxy-contracts.md` is marked resolved/done on this basis, and the Open Questions section of that plan is cleared.

## Alternatives Considered

- **One-time migration script replaying old registry data into the new proxy** — would preserve existing Sepolia registrations, but adds a one-off script with its own testing burden for data that (per prior investigation this session) is understood to be POC/test-scale data with the underlying IPFS metadata still intact independently of the on-chain index. Rejected as unnecessary effort for this project's current stage.

## Consequences

- **Positive:** Simpler cutover — plan 0028's contracts implementation proceeds without an extra migration script or its tests.
- **Negative / accepted costs:** Whatever VINs are currently registered on the live (non-upgradeable) Sepolia `VinCidRegistry` will no longer be listed by "Show all registered NFTs" once the new proxy-backed registry goes live on Sepolia, exactly as already happens on every ordinary redeploy today (see `docs/memory/contracts/redeploy-wipes-registry-uups-proxy-planned.md`). This is the last time that happens, going forward, once the proxy is in place.
- **Follow-ups required:** None — proceed with plan 0028 implementation as scoped.
