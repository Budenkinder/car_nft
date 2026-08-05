---
date: 2026-08-05
scope: contracts
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Sepolia upgraded to ship ADR 0035 + ADR 0037; discovered and fixed a missing `initializeV2` call

## Context

User reported `execution reverted` clicking "Submit on-chain receipt" against Sepolia (`chainId: 0xaa36a7`). Diagnosis: `deployments/sepolia.json` showed the Sepolia proxy was last touched on 2026-07-30 — before both ADR 0035 (`ORG_ROLE`) and ADR 0037 (`submitApplication`) existed. The deployed Sepolia bytecode had neither function; the frontend (built against the current ABI) was calling an unrecognized selector, which reverts by default with no fallback defined. This was the long-standing "Sepolia upgrade blocked pending user go-ahead" item (decision `2026-08-04-004`) surfacing as a real user-facing error rather than an abstract to-do.

Asked the user directly (`AskUserQuestion`) whether to run the upgrade now, given it's a hard-to-reverse action against shared/production infrastructure the deployed Vercel frontend already points at. Confirmed: yes.

## Decision

Ran `npm run upgrade:sepolia`. New implementation `0xdB807873843ebAC47e2933822baedDac3b592140` deployed; proxy `0x9e30596A7C80754cd5149A465e89758CAdB0F8B3` upgraded via `upgradeToAndCall(newImpl, "0x")` — address unchanged, ABI re-synced to the frontend automatically.

Immediately discovered a second, more serious gap: `scripts/upgrade.js` passes empty calldata (`"0x"`) to `upgradeToAndCall`, so it never calls `initializeV2`. That's fine for a proxy that was *bootstrapped* after ADR 0035 (`deploy.js` already calls `initializeV2` as part of bootstrap — this is why local testing all session never hit this), but Sepolia's proxy predates ADR 0035 entirely and had never had `initializeV2` called. Left as-is, `hasRole(ORG_ROLE, ...)` would return `false` for every wallet — including the incumbent minter — so `storeCid` would revert for everyone, a regression *worse* than the pre-upgrade state (where at least the minter could still write).

Wrote `scripts/initializeV2.js` (a new, narrowly-scoped one-time migration script, with `npm run initializeV2:local`/`:sepolia` aliases) and ran it against Sepolia: granted `DEFAULT_ADMIN_ROLE` to the deployer and `ORG_ROLE` to the incumbent minter (both the same address here, `0x2c2f4d8EE1976B4f4fDC46B4B8fCb6E9A60A88d6`). `initializeV2`'s own `reinitializer(2)` guard makes this script safe to run against an already-initialized proxy too (it simply reverts a second time, no harm).

Verified the full fix, live, against the deployed Sepolia contract:
- `submitApplication()` gas-estimates successfully (27,955 gas) — no longer reverts.
- Both VINs registered before the upgrade (`WBADT33383G473733`, `WBADT33383G400829`) are still readable with their original CIDs — no data loss across the upgrade.
- A freshly-generated, unfunded random wallet's `storeCid` (via `staticCall`, which doesn't require the caller to hold funds) reverts with `"Not an approved organization"` against an existing VIN — confirming the update-path gating from ADR 0035 is now actually live on Sepolia, not just tested locally.
- Full Hardhat suite still 46/46 passing.

This closes out plan `0035`'s previously-blocked task 10 and plan `0037`'s deployment story — both ADRs' contract changes are now live on Sepolia, not just localhost.

## Alternatives Considered

- **Fix `initializeV2` gap immediately, same session** *(chosen)* — the contract was left in a strictly worse state (nobody could mint/update) between the upgrade transaction and the fix; leaving that live on shared infrastructure any longer than necessary wasn't acceptable.
- **Amend `scripts/upgrade.js` to always attempt `initializeV2` via the upgrade calldata** — considered and rejected: most upgrades (including every one so far on `localhost`, and the ADR-0037 upgrade already run on `localhost` today) are on proxies that were bootstrapped *after* `initializeV2` existed, where calling it again would simply revert (harmless, but noisy) or would need conditional detection logic. A separate, explicit, narrowly-scoped script for the one genuinely special case (a proxy crossing the ADR-0035 boundary) is clearer than baking conditional migration logic into the general-purpose upgrade script.

## Consequences

- **Positive:** ADR 0035 and ADR 0037 are both now fully live on Sepolia, matching localhost. Plan 0035's task 10 (previously the only blocker keeping that plan `in-progress`) is complete and verified. The `initializeV2` gap is now permanently documented and has a reusable, safe-to-rerun script, rather than being a one-off manual `hardhat run` invocation that would need rediscovering next time.
- **Negative / accepted costs:** for a real, if brief, window on live Sepolia infrastructure, `storeCid` was callable by no one — the incumbent minter's ability to write was briefly (unintentionally) worse than before the upgrade. No evidence of anyone hitting this window; flagged for completeness, not because harm is known to have occurred.
- **Follow-ups required:** none blocking. `scripts/deploy.js`'s bootstrap path already avoids this gap for any *new* deployment; `scripts/initializeV2.js` exists for any future proxy that similarly crosses a pre-AccessControl → post-AccessControl boundary via upgrade rather than fresh bootstrap.
