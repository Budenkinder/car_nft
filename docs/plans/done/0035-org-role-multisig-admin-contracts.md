# Plan 0035 — Org role + deployer-EOA admin — Contracts

- **ADR:** `docs/adr/0035-org-role-multisig-admin.md`
- **Paired plan:** `docs/plans/done/0035-org-role-multisig-admin-frontend.md`
- **GitHub Issue:** [#43](https://github.com/Budenkinder/car_nft/issues/43)
- **Status:** done
- **Date:** 2026-08-03

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Upgrade `VinCidRegistry` behind its existing UUPS proxy so that minting **and** updating a VIN require `ORG_ROLE`, with `DEFAULT_ADMIN_ROLE` held by the contract deployer EOA — the same address that already holds `owner()` today. `owner()` (upgrade authority, reward configuration, withdrawals) and `CarRewardToken` ownership are unchanged; nothing transfers.

Out of scope:

- Any multisig/Safe admin scheme — considered and dropped, see decision `2026-08-04-001`.
- The CRT token economy — `rewardAmount`, `_payReward`, and the reward pool are untouched (ADR 0036).
- ADR 0030's typed record entries (`VehicleRecordEntry`, service/document/damage-flag functions). Only its *access-control* half is absorbed, as the `VERIFIER_ROLE` declaration.
- Any change to `CidStored`, the getters, or `tokenURI` — nothing about what is publicly readable changes here.
- Mainnet. Localhost → Sepolia only.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `contracts/car_nft_sc.sol` | modify | inherit `AccessControlUpgradeable`; `ORG_ROLE`/`VERIFIER_ROLE` constants; `initializeV2` reinitializer; gate both branches of `storeCid`; remove `setMinter`/`MinterChanged` |
| `scripts/deploy.js` | modify | on a fresh deploy, grant `DEFAULT_ADMIN_ROLE` and `ORG_ROLE` to the deployer/`INITIAL_MINTER` via `initializeV2` |
| `scripts/manage-org-role.js` | add | terminal script: grant/revoke `ORG_ROLE` for a wallet, run by the deployer (decision `2026-08-04-002`) |
| `scripts/initializeV2.js` | add | one-time migration script for a proxy bootstrapped before ADR 0035 and since upgraded — calls `initializeV2` since `scripts/upgrade.js` only swaps bytecode (discovered running task 10 against Sepolia; decision `2026-08-05-009`) |
| `package.json` | modify | `org-role:local` / `org-role:sepolia` / `initializeV2:local` / `initializeV2:sepolia` scripts |
| `test/VinCidRegistry.roles.test.js` | add | role gating, migration, admin grant/revoke |
| `test/VinCidRegistry.upgrade.test.js` | modify | storage-layout compatibility across the V2 upgrade |
| `test/fixtures.js` | modify | fixture deploying the V2 shape with the deployer as admin |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [x] **1.** Add `AccessControlUpgradeable` to the inheritance list and call `__AccessControl_init()` from a new `initializeV2(address admin)` guarded by `reinitializer(2)`. In the same function: `_grantRole(DEFAULT_ADMIN_ROLE, admin)`, `_grantRole(ORG_ROLE, minter)` (so the incumbent operator keeps working), and `require(admin != address(0))`. Declare `bytes32 public constant ORG_ROLE = keccak256("ORG_ROLE")` and `VERIFIER_ROLE` likewise — constants live in bytecode, not storage, so they cost no slots.
- [x] **2.** Prove storage-layout safety **before** touching `storeCid`. OZ 5.x upgradeable contracts use ERC-7201 namespaced storage, so `AccessControlUpgradeable` should not consume sequential slots or disturb `__gap` — verify, do not assume: extend `test/VinCidRegistry.upgrade.test.js` to deploy V1, write VIN + CID + reward config, upgrade to V2, and assert every pre-existing value survives byte-for-byte. If the layout does shift, stop and amend this plan rather than shrinking `__gap` on a hunch.
- [x] **3.** Gate `storeCid`: replace `require(msg.sender == minter, "Only minter can mint")` with `require(hasRole(ORG_ROLE, msg.sender), "Not an approved organization")` on the mint branch, and add the same check on the update path (currently ungated — this is the vulnerability fix). Keep the `recipient != address(0)` requirement on mints. Update the NatSpec, including the now-false *"Updates are open in this POC"* comment.
- [x] **4.** Remove `setMinter` and the `MinterChanged` event. **Keep the `minter` storage variable** — deleting it would shift every slot after it. Mark it deprecated in a comment: retained for layout compatibility, no longer read by any code path, never to be reused.
- [x] **5.** Extend `scripts/deploy.js`: after `initialize`, call `initializeV2(deployerAddress)` so the deployer holds `DEFAULT_ADMIN_ROLE` — identical to how it already holds `owner()` today — then grant `ORG_ROLE` to `INITIAL_MINTER` (a no-op grant if `INITIAL_MINTER` already equals the deployer). No ownership transfer, no new env var. Leave the existing frontend `.env.local`/ABI sync untouched.
- [x] **6.** Write `test/VinCidRegistry.roles.test.js`: a non-org wallet cannot mint; a non-org wallet **cannot update an existing VIN** (the regression test for today's hole); an `ORG_ROLE` wallet can do both; a non-admin cannot `grantRole`; the deployer-admin can grant and revoke `ORG_ROLE` to/from arbitrary wallets; a revoked org loses both abilities; `initializeV2` cannot be called twice; the incumbent `minter` retains access post-migration.
- [x] **7.** Add `scripts/manage-org-role.js`, following `scripts/upgrade.js`'s pattern: read the network's `deployments/<network>.json` artifact for the proxy address, use the deployer's Hardhat signer, read `TARGET_WALLET` (required — exit with a clear error if missing) and `ROLE_ACTION` (`grant` by default, or `revoke`) from the environment, call `grantRole(ORG_ROLE, TARGET_WALLET)` or `revokeRole(ORG_ROLE, TARGET_WALLET)`, wait for the transaction, and print the resulting `hasRole(ORG_ROLE, TARGET_WALLET)` to confirm. Scoped to `ORG_ROLE` only — `VERIFIER_ROLE` is unused (decision `2026-08-03-004`) and gets its own tooling later if activated. Add `org-role:local` / `org-role:sepolia` to `package.json`.
- [x] **8.** Run `npm test` and `npm run test:report`; confirm the existing 4 suites still pass and that `docs/testing/automated-test-report.md` regenerates. *(40/40 passing, including the new roles and migration suites.)*
- [x] **9.** Deploy to localhost end-to-end: fresh deploy, confirm the deployer holds `DEFAULT_ADMIN_ROLE` and `INITIAL_MINTER` holds `ORG_ROLE`, then run `TARGET_WALLET=<second wallet> npm run org-role:local` and confirm that wallet can mint while an ungranted third wallet cannot mint or update; run again with `ROLE_ACTION=revoke` and confirm the second wallet is locked out too. *(Verified 2026-08-04.)*
- [x] **10.** Deploy the upgrade to Sepolia with the existing `npm run upgrade:sepolia` flow. *(Done 2026-08-05, with explicit user go-ahead — see decision `2026-08-05-009`. Proxy `0x9e30596A7C80754cd5149A465e89758CAdB0F8B3` upgraded to implementation `0xdB807873843ebAC47e2933822baedDac3b592140`; address unchanged. Discovered along the way: `scripts/upgrade.js` only swaps bytecode, it never calls `initializeV2` — since this proxy predates ADR 0035 entirely (bootstrapped 2026-07-30), roles were never bootstrapped, meaning `storeCid` would have reverted for every wallet, including the incumbent minter, until fixed. Wrote a new one-time migration script, `scripts/initializeV2.js` (+ `npm run initializeV2:sepolia`/`:local`), and ran it: deployer now holds `DEFAULT_ADMIN_ROLE`, incumbent minter now holds `ORG_ROLE`. Verified: both pre-upgrade VINs (`WBADT33383G473733`, `WBADT33383G400829`) still readable with their original CIDs; a freshly-generated non-org wallet's `storeCid.staticCall` on an existing VIN reverts with "Not an approved organization"; `submitApplication()` (ADR 0037) no longer reverts, confirmed via a live gas estimate against the deployed contract.)*
- [x] **11.** On approval of this trio: move ADR 0030's plan trio to `docs/plans/rejected/`, per decision `2026-08-03-004`, and close issue #36 as not planned with a pointer to this ADR. *(Files moved; issue closure blocked on `gh` token permissions — see decision `2026-08-04-005`.)*

## Contract Surface

- **New constants:** `ORG_ROLE`, `VERIFIER_ROLE` (bytecode, no storage).
- **New functions:** `initializeV2(address admin)` (`reinitializer(2)`); inherited `grantRole`/`revokeRole`/`hasRole`/`getRoleAdmin` from `AccessControlUpgradeable`.
- **Removed:** `setMinter(address)`, `event MinterChanged`.
- **Changed:** `storeCid` — both branches now require `ORG_ROLE`. **Breaking** for any caller that is not an approved org; today that means every wallet except the current `minter` loses the ability to update, which is the point.
- **Storage:** no new sequential variables. `minter` retained, dead. `__gap` untouched at `uint256[50]` — verify in task 2.
- **Access control:** `DEFAULT_ADMIN_ROLE` (deployer EOA) → grants/revokes `ORG_ROLE`; `owner()` (deployer EOA, unchanged) → upgrades, reward config, `withdrawToken`.
- **Gas:** one `hasRole` SLOAD added per `storeCid` call (~2,100 gas cold). Negligible against a mint.

## Interfaces with Frontend

- ABI: regenerated into `frontend/src/utils/contract_abi.json` by `deploy.js` as usual — treat as generated. The frontend needs `hasRole(bytes32,address)` and the `ORG_ROLE` constant getter.
- Addresses: unchanged. The proxy address is stable across this upgrade (the entire point of ADR 0028).
- Events consumed: `RoleGranted`/`RoleRevoked` (from `AccessControlUpgradeable`) are now consumed by the paired plan's org-wallet list — reconstructed client-side via `getPastEventsChunked`, the same pattern already used for `CidStored` history (decision `2026-08-04-002`). No indexed-parameter changes needed; these are the stock OZ event signatures.

## Testing

- Hardhat unit tests as per task 6, using `network.create()` + `loadFixture` per the existing suite convention.
- Security checks: access control on every state-mutating function; the update path specifically (regression); `reinitializer` replay; that a revoked org is genuinely locked out; that admin cannot be silently reassigned.
- Local deploy + integration check against the frontend before any Sepolia action.
- Storage-layout verification is task 2 and blocks everything after it.

## Deployment and Migration

Upgrade, not redeploy. Sequence: localhost fresh deploy → localhost upgrade-from-V1 → `npm run upgrade:sepolia` (unchanged script, deployer signs directly) → verify. Etherscan verification of the new implementation as usual.

## Risks and Rollback

- **Bricking administration.** If `initializeV2` is called with a wrong or unreachable admin address, or if the deployer key is lost, there is no recovery: no upgrades, no role grants, ever. This is the same single-key risk `owner()` already carried before this ADR — decision `2026-08-04-001` accepts it rather than taking on a Safe. Mitigation: verify the admin address on-chain immediately after the upgrade, before relying on it for any real grant.
- **Breaking the live frontend.** Post-upgrade, the currently-configured minter wallet keeps `ORG_ROLE` via task 1, so the deployed UI keeps working. Any *other* wallet that was silently updating VINs stops — intended.
- **Rollback:** the proxy can be upgraded back to the V1 implementation with the same `npm run upgrade:sepolia` flow from the deployer key (the V1 address is in `deployments/sepolia.json`). Role state would persist harmlessly since V1 never reads it. Rollback is a single deployer transaction, same as before this plan.

## Open Questions

- **Should the car's current NFT owner be able to update their own vehicle's record?** ADR 0030 proposed minter-or-owner; this plan restricts updates to `ORG_ROLE` only, per the user's stated model ("registered orgs can create/update VINs"). Owner self-service can be added later as `hasRole(ORG_ROLE, msg.sender) || _ownerOf(tokenId) == msg.sender`, but it weakens the tamper-resistance argument — a seller could then edit their own car's history. Confirm the stricter reading.
- **Should `ORG_ROLE` grants be time-limited** (e.g. re-verification when the insurance certificate expires — the application form collects an expiry date)? Not modelled here; would need an expiry mapping and a check in `storeCid`. Flagged because the form asks for the data.
- **Is single-deployer-key admin acceptable long-term, or only for this project's current stage?** Decision `2026-08-04-001` accepts it as no worse than the status quo, but if the registry gains real independent operators, revisit distributed admin custody as its own ADR (Option C/D territory in ADR 0035) rather than reintroducing a Safe ad hoc.
