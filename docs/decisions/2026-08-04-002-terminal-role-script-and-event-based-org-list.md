---
date: 2026-08-04
scope: both
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Role grants get a dedicated terminal script; the frontend's org-wallet list is reconstructed from events, not `AccessControlEnumerableUpgradeable`

## Context

Decision `2026-08-04-001` settled that the deployer EOA holds `DEFAULT_ADMIN_ROLE`, with grants done via a plain `grantRole` transaction — Etherscan's "Write Contract" tab or a script, left unspecified. The user has now asked for two concrete follow-ups: (1) a real terminal script for granting `ORG_ROLE` to a new wallet, rather than leaving it to ad hoc Etherscan use, and (2) a read-only list in the frontend, "on the side," showing every wallet currently allowed to register VINs. The user was explicit that this is **not** an admin/grant UI — that stays out of the frontend, per decision `2026-08-04-001` — it is a display-only feature.

Showing "every wallet that currently holds `ORG_ROLE`" needs some way to enumerate role members. Plain `AccessControlUpgradeable` has no enumeration — only `hasRole(role, account)` for a single address at a time. Two ways to get a list:

- Add OpenZeppelin's `AccessControlEnumerableUpgradeable`, which tracks members in an `EnumerableSet` and adds `getRoleMemberCount`/`getRoleMember`. This is a contract storage change — new state, on top of the first real exercise of this project's upgrade path (ADR 0028).
- Reconstruct the current member set from the `RoleGranted`/`RoleRevoked` events that `AccessControlUpgradeable` already emits on every grant/revoke (including the ones `initializeV2` performs during migration) — no contract change beyond what plan 0035 already does.

This project already has the second pattern built and working: `getTransactionHistoryForVin` (`frontend/src/utils/pinata_ipfs_nft_service.js`) reconstructs a VIN's history from `CidStored` events using `getPastEventsChunked` + `getContractDeployBlock`, specifically to avoid unbounded `eth_getLogs` scans (ADR 0027, `docs/memory/frontend/event-queries-must-be-chunked.md`).

## Decision

**Terminal script:** add `scripts/manage-org-role.js`, following the existing `scripts/upgrade.js` pattern (reads the network's `deployments/<network>.json` artifact, uses the deployer's Hardhat signer, no interactive prompts). It reads `TARGET_WALLET` (required) and `ROLE_ACTION` (`grant` by default, or `revoke`) from the environment, calls `grantRole(ORG_ROLE, TARGET_WALLET)` / `revokeRole(ORG_ROLE, TARGET_WALLET)`, and prints the resulting `hasRole` value to confirm. Scoped to `ORG_ROLE` only — `VERIFIER_ROLE` stays unused per decision `2026-08-03-004` and gets its own tooling if and when it is activated. New npm scripts `org-role:local` / `org-role:sepolia`.

**Frontend list:** reconstruct current `ORG_ROLE` holders from `RoleGranted`/`RoleRevoked` events, reusing the existing `getPastEventsChunked` + `getContractDeployBlock` machinery — no `AccessControlEnumerableUpgradeable`, no new contract storage. A wallet is a current holder if its most recent matching event is a grant, not a revoke.

## Alternatives Considered

- **Event reconstruction for the list** *(chosen)* — zero contract change beyond what plan 0035 already ships, reuses working, tested infrastructure, and matches this codebase's established convention for "list of X" features.
- **`AccessControlEnumerableUpgradeable`** — real enumeration with less client-side logic, but adds storage to a proxy whose upgrade-safety this plan is already treating carefully (task 2's byte-for-byte storage check), for a feature the event log already answers. Rejected as disproportionate.
- **No terminal script, Etherscan only** — the status quo implied by decision `2026-08-04-001`. Rejected now that the user has asked for a repeatable, scriptable path — useful the moment there is more than one organization to onboard.

## Consequences

- **Positive:** the contract surface from plan 0035 is unchanged by this decision — no new inheritance, no new storage. Role administration becomes repeatable and scriptable instead of manual Etherscan clicks. The org-wallet list reuses proven event-reconstruction code instead of adding a second enumeration mechanism.
- **Negative / accepted costs:** the frontend list's accuracy depends on chunked event scans covering the full range since deploy — same bounded-RPC caveat that already applies to `CidStored` history. If the contract is ever redeployed fresh (not upgraded), `RoleGranted` history resets with it, same as `CidStored` history does.
- **Follow-ups required:** contracts plan 0035 gets a new task for `scripts/manage-org-role.js`; frontend plan 0035 gets new tasks for `getOrgRoleHolders(chainId)` and a sidebar component consuming it. ADR 0035's frontend-impact language is updated to mention the read-only list.
