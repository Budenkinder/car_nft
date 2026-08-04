---
date: 2026-08-04
scope: contracts
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: 2026-08-03-003-two-of-three-safe-as-admin.md
---

# The contract deployer EOA holds `DEFAULT_ADMIN_ROLE` and `owner()`; the 2-of-3 Gnosis Safe is dropped from ADR 0035

## Context

Reviewing plan 0035 before approval, the user rejected the 2-of-3 Gnosis Safe: *"Ethereum doesn't provide this solution."* A Safe is not a base-protocol Ethereum primitive — it is a separate, third-party smart-contract system (Gnosis Safe) that this project would have to deploy, fund, and operate with three independently-held signer keys. The user does not want to take on that dependency. Role granting — `grantRole(ORG_ROLE, wallet)` and its revoke counterpart — should be done directly by the contract deployer instead.

## Decision

`DEFAULT_ADMIN_ROLE` and `owner()` stay with the contract deployer EOA — the same address that already controls `VinCidRegistry` today. No Safe is created. `initializeV2`'s `admin` parameter is the deployer address, not a Safe address. `CarRewardToken` ownership is likewise left with the deployer, not transferred anywhere.

A direct consequence: `npm run upgrade:sepolia` keeps working unchanged, since the deployer key can still sign the upgrade transaction directly. The two-step upgrade flow decision 003 required specifically *because* a Safe cannot sign a normal transaction (`scripts/prepare-upgrade.js`, plus the owner-mismatch guard in `scripts/upgrade.js`) is no longer needed and is dropped from plan 0035's contracts trio.

## Alternatives Considered

- **Single deployer EOA as admin** *(chosen)* — no new infrastructure, no new key-custody problem beyond the one that already exists for `owner()` today, and it is fully within stock Ethereum + OpenZeppelin `AccessControlUpgradeable` — no external contract system.
- **2-of-3 Gnosis Safe** *(original decision 003, superseded here)* — rejected by the user as introducing a third-party dependency ("Ethereum doesn't provide this solution") the project does not want to operate.
- **3-of-5 Safe** — already rejected in decision 003 as disproportionate; remains rejected a fortiori.

## Consequences

- **Positive:** removes an entire operational dependency — no Safe to deploy, no three independently-held signer keys to source and keep independent, no Safe UI to operate for every admin action. `scripts/prepare-upgrade.js` and the `upgrade.js` owner-guard drop out of plan 0035's contracts scope entirely, shrinking the change. Rollback (upgrading back to V1) is a single deployer transaction again, not a Safe transaction needing 2 signers.
- **Negative / accepted costs:** reintroduces single-key custody for admin actions — `ORG_ROLE` grants/revokes, upgrades, and reward/withdraw configuration all depend on one EOA with no recovery if that key is lost or compromised. This is the exact bottleneck concern that motivated considering a Safe in the first place. Accepted because it is **no worse than the contract's pre-ADR-0035 status quo** (a single `minter`/`owner` EOA already existed and already carried this risk) — and it is now scoped more narrowly than before, since `ORG_ROLE` lets multiple approved organizations mint once granted, rather than one single minter address doing all minting.
- **Follow-ups required:** plan 0035's contracts trio needs task-level edits — drop `scripts/prepare-upgrade.js`, drop the `upgrade.js` owner-guard task, drop the Safe-admin test fixture, drop `SAFE_ADDRESS` from `.env.example` and `deploy.js`, drop the `CarRewardToken` ownership-transfer task (nothing to transfer), and drop the "who are the three Safe signers" open question. The frontend trio has no Safe-specific tasks and needs only a wording fix in its Out of Scope section (admin UI point referenced "the Safe's own interface"). ADR 0035 is edited in place to describe deployer-EOA admin, since it is still `status: proposed` (pre-approval) — no separate superseding ADR is needed for a change made before approval.
