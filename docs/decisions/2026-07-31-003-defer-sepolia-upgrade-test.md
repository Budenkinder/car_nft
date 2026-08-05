---
date: 2026-07-31
scope: contracts
status: accepted
related_adr: 0028-vin-registry-uups-proxy
supersedes: none
---

# Defer exercising `npm run upgrade:sepolia` until a real contract change ships

## Context

Plan 0028 (done) flagged the Sepolia upgrade path as implemented and tested on `localhost`, but not yet exercised on Sepolia itself. After discussing how to test it (deploy a no-op or real change, run `npm run upgrade:sepolia`, verify state survives), the user confirmed there's no need to run it right now.

## Decision

No action taken. `scripts/upgrade.js` stays unexercised on Sepolia until the next real contract change to `VinCidRegistry` ships, at which point that deploy naturally serves as the first live test.

## Alternatives Considered

- Dry-run the upgrade now with no code change, purely to prove the mechanics (new implementation deploy + `upgradeToAndCall` + address/data stability) — available on request, not chosen; the user preferred to wait.

## Consequences

- No Sepolia gas spent, no change to `deployments/sepolia.json` or the live implementation address.
- The Sepolia upgrade path remains a known, called-out gap (`docs/memory/contracts/vincidregistry-uups-proxy.md`) — not a blocker, just untested until it's next needed.
