# ADR 0035: Replace the single `minter` with an `ORG_ROLE`, administered by the contract deployer, with email-based org onboarding

- **Status:** proposed
- **Date:** 2026-08-03 (admin model revised 2026-08-04)
- **Scope:** both
- **Related plans:**
  - `docs/plans/in-progress/0035-org-role-multisig-admin-frontend.md`
  - `docs/plans/in-progress/0035-org-role-multisig-admin-contracts.md`
- **Related decisions:** `docs/decisions/2026-08-03-001-org-application-intake-by-email.md`, `docs/decisions/2026-08-03-002-kyb-documents-stay-off-chain.md`, `docs/decisions/2026-08-03-003-two-of-three-safe-as-admin.md` (superseded), `docs/decisions/2026-08-03-004-merge-adr-0030-access-control-into-0035.md`, `docs/decisions/2026-08-03-005-defer-token-economy-to-adr-0036.md`, `docs/decisions/2026-08-04-001-deployer-eoa-replaces-safe-as-admin.md`, `docs/decisions/2026-08-04-002-terminal-role-script-and-event-based-org-list.md`

## Context

Today `VinCidRegistry` has exactly two privileged addresses, both single EOAs:

- `minter` — the only address that may mint a new VIN (`contracts/car_nft_sc.sol:77`).
- `owner()` — controls `setMinter`, `setRewardToken`, `setRewardAmount`, `withdrawToken`, and UUPS upgrade authorization (`_authorizeUpgrade`, line 158).

Two problems follow. First, a single key is the entire approval authority for who may write vehicle history — the trust bottleneck a blockchain project exists to avoid, and a single compromise away from total loss of control. Second, and more urgent: **updates to an existing VIN are gated to nobody at all.** `storeCid` checks `msg.sender` only on the `isNewMint` branch (line 76-79). Any wallet can overwrite any registered car's CID today. The contract's own comment admits it: *"Updates are open in this POC."* Gating mints to approved organizations while leaving updates open would secure the front door and leave the back door off its hinges.

The user's target model, from this session's design conversation: real repair organizations apply to have their wallet registered, a small team reviews the application against business credentials, and approval grants that wallet the right to create and update VIN records. Full DAO/TCR governance was considered and set aside as disproportionate. A multisig (Gnosis Safe) was considered next and also set aside — decision `2026-08-04-001` — since it is a third-party contract system outside base Ethereum, not something this project wants to deploy and operate. The contract deployer's own EOA remains the approval authority, unchanged from how `owner()` already works today.

Verifying "this is a legitimate repair shop" is a KYB problem, not a smart-contract problem. No contract arrangement settles a real-world fact. What the contract can do is stop letting *any* wallet write vehicle history — gating that to wallets the deployer has explicitly approved, and, unlike today, gating updates the same way mints already are.

## Decision

Three changes, shipped as one UUPS upgrade (ADR 0028 exists for exactly this):

**1. Role-based access, replacing `minter`.** Add `AccessControlUpgradeable` (OpenZeppelin 5.6.1, already a dependency). Define `ORG_ROLE` for approved organizations: required to mint **and** to update. `DEFAULT_ADMIN_ROLE` — which grants and revokes `ORG_ROLE` — is held by the deployer EOA. Existing state migrates via a `reinitializer(2)` function that grants `ORG_ROLE` to the incumbent `minter` so nothing in flight breaks.

`VERIFIER_ROLE` is declared in the same change, unused for now, so that ADR 0030's damage-flag authority lands in one coherent role model rather than a second one bolted on later (see decision `2026-08-03-004`).

**2. The contract deployer as the approval authority.** Approving an organization is a normal transaction from the deployer wallet calling `grantRole(ORG_ROLE, wallet)`; revoking is the same in reverse. No Safe, no voting contract, no token, no governance code to audit, and no new third-party dependency. `owner()` — and therefore upgrade authority — stays exactly where it is today, with the deployer EOA, as does `CarRewardToken`'s separate `Ownable` owner. **Consequence, deliberately accepted (decision `2026-08-04-001`, superseding `2026-08-03-003`):** admin authority for `ORG_ROLE` grants, upgrades, and reward configuration remains a single key, with no recovery if it is lost — the same risk `owner()` already carried before this ADR, now also covering role grants. `npm run upgrade:sepolia` keeps working unchanged, since the deployer can still sign the upgrade transaction directly; no two-step Safe upgrade flow is needed.

**3. An application page, submitted by email.** A public form collects organization identity, trade qualification, insurance, contact person, and the wallet address, plus a `personal_sign` proof that the applicant controls the wallet they are registering. Submission opens a prefilled email; KYB documents are attached by the applicant to that email. No backend, no database, no document storage anywhere in this system (decisions `2026-08-03-001`, `-002`).

Out of scope, deliberately: the CRT token economy. The user's intended model — readers purchase CRT to look up VIN details — is a different design with its own blocking question, split into ADR 0036. `rewardAmount` and `_payReward` are untouched here (decision `2026-08-03-005`).

## Options Considered

### Option A — `ORG_ROLE` + deployer-EOA admin, email intake (chosen)
- **Pros:** Turns a single key that could mint *and* silently overwrite any VIN into a single key that only approves other wallets, which then mint under their own role — a narrower blast radius even though custody is still one key. Uses an audited OZ module already in the dependency tree. Ships as an upgrade behind the existing proxy, so the registry address and all data survive. Closes the open-update hole in the same change. Email intake means zero new infrastructure and no PII ever entering the system's storage. No third-party contract system (Safe) to deploy or operate — everything here is stock Ethereum plus OpenZeppelin.
- **Cons:** Admin authority — role grants, upgrades, reward configuration — is still one key with no recovery if it is lost or compromised; decision `2026-08-04-001` accepts this as no worse than the pre-ADR status quo. Email intake gives no queue, no audit trail, and no status visibility for the applicant.

### Option A' — `ORG_ROLE` + 2-of-3 Safe admin, email intake (original choice, superseded 2026-08-04)
- **Pros:** Would have removed the single-key bottleneck for approval and upgrades with no new on-chain governance surface.
- **Cons:** Requires deploying and operating a third-party contract system (Gnosis Safe) with three independently-held signer keys — rejected by the user as introducing a dependency Ethereum itself doesn't provide (decision `2026-08-04-001`). Still "a fixed committee decides" — decentralized in key custody, not in authority. Losing 2 of 3 signer keys would have been unrecoverable.

### Option B — Keep the single `minter`, add a multisig only for `owner()`
- **Pros:** Smaller change; upgrade authority is protected without touching the minting path.
- **Cons:** Leaves the actual complaint unaddressed — one key still decides who may write vehicle history — and leaves updates open to everyone. Also reintroduces the Safe dependency Option A' was rejected for. Rejected as solving the wrong half.

### Option C — Governance by approved orgs (N-of-M existing orgs co-sign the next approval), or a token-curated registry
- **Pros:** Genuinely decentralized authority, not just distributed custody; the endgame if this becomes a real registry.
- **Cons:** Bootstrapping problem (who approves the first orgs?), plus voting/staking/dispute-resolution surface far beyond a project with one operator and a handful of VINs. And it does not remove the KYB trust anchor — it spreads it across people who still read the same paperwork. Deferred, not rejected: revisit as its own ADR if the registry gains real participants.

### Option D — Attestation-based (EAS or a chamber-of-crafts registry API), contract checks for N valid attestations
- **Pros:** Pushes trust to specialized independent verifiers; no list for this project to maintain.
- **Cons:** Depends on attesters who do not currently exist for German Kfz workshops, and on infrastructure this project would have to bootstrap alone. A future path once such attesters are real, not a step available today.

## Consequences

- **Positive:** Minting is no longer bound to one fixed address — any wallet the deployer approves can mint under `ORG_ROLE`. Updates become gated for the first time — a real vulnerability closed. The role model is defined once, so ADR 0030's verifier authority has somewhere coherent to land. No new third-party infrastructure to deploy or operate.
- **Negative / accepted costs:** Admin authority (role grants, upgrades, reward configuration, `CarRewardToken` ownership) remains a single deployer key with no recovery if it is lost or compromised — decision `2026-08-04-001` accepts this as unchanged from the contract's pre-ADR-0035 status quo, not a new risk. Email intake means applications live in an inbox — no queue, no SLA, no applicant-facing status; it will not scale past a handful of applicants and is explicitly a v1 stopgap.
- **Frontend impact:** New application page; role-aware gating of the create/update panel (a wallet without `ORG_ROLE` sees a "not approved" state and a link to apply); new validators; `personal_sign` challenge flow; a read-only sidebar list of every wallet currently holding `ORG_ROLE`, reconstructed from `RoleGranted`/`RoleRevoked` events (decision `2026-08-04-002`) — display only, no grant/revoke UI.
- **Contracts impact:** New inheritance (`AccessControlUpgradeable`), a `reinitializer(2)` migration, tightened `storeCid` access control (**a breaking behavior change for any caller that is not an approved org**), `setMinter`/`MinterChanged` removed while the `minter` storage slot is retained-but-dead. `owner()` and `CarRewardToken` ownership are untouched — both stay with the deployer. First real exercise of the upgrade path since ADR 0028's bootstrap; `npm run upgrade:sepolia` continues to work unchanged. A new terminal script, `scripts/manage-org-role.js` (decision `2026-08-04-002`), gives the deployer a repeatable way to grant/revoke `ORG_ROLE` without hand-crafting Etherscan transactions.
- **Follow-ups:** ADR 0030's plan trio is superseded by this one and moves to `rejected/` on approval; its data model (typed record entries) returns later as its own trio consuming these roles. ADR 0036 carries the token economy. Whether the *car owner* should also be able to update their own vehicle's record — 0030 proposed minter-or-owner — is left open (see the contracts plan's Open Questions); this ADR restricts updates to `ORG_ROLE` only, per the user's stated model. Whether a Safe or other distributed-custody scheme for admin should be revisited is deferred to Option C/D territory (see decision `2026-08-04-001`), not reopened here.

## References

- `contracts/car_nft_sc.sol:69-101` (`storeCid`, the open-update branch), `:103-107` (`setMinter`), `:158` (`_authorizeUpgrade`).
- `docs/adr/0028-vin-registry-uups-proxy.md` — the upgrade path and append-only storage discipline this change relies on.
- `docs/adr/0030-structured-vehicle-record.md` — the access-control half is absorbed here; see decision `2026-08-03-004`.
- `docs/adr/0036-crt-token-economy.md` — the pay-to-read token model, split out of this change.
- `docs/decisions/2026-08-04-001-deployer-eoa-replaces-safe-as-admin.md` — the Safe was dropped in favor of deployer-EOA admin.
- `docs/decisions/2026-08-04-002-terminal-role-script-and-event-based-org-list.md` — the terminal grant/revoke script, and event-reconstruction (not `AccessControlEnumerableUpgradeable`) for the frontend's org-wallet list.
- `frontend/src/utils/pinata_ipfs_nft_service.js:111-160` (`getPastEventsChunked`, `getTransactionHistoryForVin`) — the existing event-reconstruction pattern the org-wallet list reuses.
- OpenZeppelin `AccessControlUpgradeable` 5.6.1 (already in `package.json`), which uses ERC-7201 namespaced storage — the property that makes adding it to an existing proxy storage-safe.
- **GitHub Issue:** [#43](https://github.com/Budenkinder/car_nft/issues/43)
