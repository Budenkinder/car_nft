---
date: 2026-08-03
scope: contracts
status: superseded
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# A 2-of-3 Gnosis Safe holds `DEFAULT_ADMIN_ROLE` and `owner()`, replacing the single deployer EOA

## Context

Both privileged addresses on `VinCidRegistry` are single EOAs: `minter` (the only wallet that may mint) and `owner()` (upgrades, reward config, withdrawals). One compromised key ends the project. The design conversation weighed a multisig against org-co-signed approvals and a token-curated registry; the multisig was chosen as proportionate to the project's stage.

3-of-5 was suggested in that conversation; the user chose **2-of-3**.

## Decision

A 2-of-3 Gnosis Safe on Sepolia holds `DEFAULT_ADMIN_ROLE` (grants and revokes `ORG_ROLE`) and `owner()` (upgrade authority, reward configuration, withdrawals). `CarRewardToken`'s separate `Ownable` owner moves to the same Safe.

Approving an organization is a Safe transaction calling `grantRole(ORG_ROLE, wallet)`. No voting contract, no governance token, no new code to audit.

## Alternatives Considered

- **2-of-3 Safe** *(chosen)* — user's call. Meaningful key distribution at a threshold three people can actually operate.
- **3-of-5** — more robust against a single lost key, but needs five real people with five separately-held wallets. Overstated for this project's size.
- **Single EOA (status quo)** — the problem being solved.
- **DAO / token-curated registry** — genuine decentralization of *authority* rather than custody, deferred in ADR 0035 Option C as disproportionate.

## Consequences

- **Positive:** no single key approves organizations or upgrades the contract.
- **Negative / accepted costs:** **losing 2 of 3 keys is unrecoverable** — no admin, no upgrades, no new organizations, permanently. At 2-of-3 the margin is one key. Every future upgrade and every economic parameter change becomes a manual Safe transaction, including rollbacks, which are now slower.
- **`npm run upgrade:sepolia` stops working from the deployer key.** Plan 0035 adds `scripts/prepare-upgrade.js` (deploy implementation, print calldata for the Safe) and a guard in `upgrade.js` so the failure is explicit rather than a bare revert.
- **Follow-ups required:** the three signers must be genuinely independent — two keys on one laptop is a 2-of-3 in name only. Execute a trivial Safe transaction *before* transferring ownership, and transfer `CarRewardToken` only after the registry upgrade is verified, so one mistake cannot brick both.
