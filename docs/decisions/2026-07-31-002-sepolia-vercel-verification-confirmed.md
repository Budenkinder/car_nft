---
date: 2026-07-31
scope: both
status: accepted
related_adr: 0028-vin-registry-uups-proxy
supersedes: none
---

# End-to-end verification: Vercel Production against the proxy-backed Sepolia registry works

## Context

Plan 0028's frontend task 2 could only be partially verified from this session: contract-call-level checks (`getAllVins`/`getCidByVin`) passed locally, but the full wallet-driven browser click-through against a live UI was left as a manual step for the user, since this container has no browser. Separately, task 3 (updating Vercel Production's `REACT_APP_SMART_CONTRACT_ADDRESS`/`REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK` and redeploying `main`) was also a manual, outside-the-session action.

The user completed both: redeployed `main` on Vercel with the new proxy address/block, then loaded the app and reported "after loading the cids, I received the registered VINs. So it worked like expected."

## Decision

Treat this as confirmation that the full ADR 0028 rollout — upgradeable `VinCidRegistry` behind an `ERC1967Proxy`, bootstrapped on Sepolia, wired into Vercel Production — works end-to-end with zero frontend code changes, closing the last verification gap noted in plan 0028's frontend task 2.

## Alternatives Considered

None — this is a verification record, not a design choice between options.

## Consequences

- Plan 0028 (already moved to `docs/plans/done/` this session) has no remaining open verification gaps; its frontend task 2 note and `docs/memory/contracts/vincidregistry-uups-proxy.md` were updated to reflect this.
- Confidence that the proxy pattern is transparent to the frontend, as ADR 0028 predicted — no code changes were needed, only the one-time address/block env-var update.
- Still open (unrelated to this verification, called out previously): the Sepolia *upgrade* path (`npm run upgrade:sepolia`) has been implemented and tested on `localhost` but not yet exercised on Sepolia.
