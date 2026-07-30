# ADR 0028: Make `VinCidRegistry` upgradeable via a UUPS proxy so registered VIN/CID data survives contract upgrades

- **Status:** proposed
- **Date:** 2026-07-29
- **Scope:** both
- **Related plans:**
  - `docs/plans/draft/0028-vin-registry-uups-proxy-frontend.md`
  - `docs/plans/draft/0028-vin-registry-uups-proxy-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-29-012-vin-registry-uups-proxy-chosen.md`

## Context

The user noticed that "Show all registered NFTs" returned an empty list after a Sepolia redeploy and asked why. The answer: every deploy of `VinCidRegistry` (`contracts/car_nft_sc.sol`) creates a brand-new contract instance at a new address with empty storage. `vinToCid`, `tokenIdToVin`, and `vinKeys` (`contracts/car_nft_sc.sol:16-18`) all reset to zero — there is no migration step, so every registered VIN/CID pair is orphaned (still readable off-chain via IPFS/Pinata, but no longer indexed on-chain).

The user then asked how to achieve an upgrade path where internal data transfers to the new address, and specifically whether a proxy-based upgrade also has a gas cost. Two approaches were discussed in chat:

1. **Proxy pattern** — storage lives permanently at a proxy address; "upgrading" swaps only the logic contract behind it. Pays a small `DELEGATECALL` tax on every state-changing call, forever, but the upgrade event itself is O(1) regardless of how much data has accumulated.
2. **Migration script** — keep today's fully-fresh-deploy-per-release model, and replay every existing VIN into the new contract via `storeCid`. No per-call tax, but the migration cost is O(n) in registered VINs, and it discards mint-block provenance (relevant to ADR 0027, which reconstructs provenance from event history).

This ADR adopts option 1.

## Decision

Convert `VinCidRegistry` to an upgradeable contract deployed behind an ERC-1967 proxy, using the **UUPS** pattern (`UUPSUpgradeable`, upgrade authority via `_authorizeUpgrade` gated by `onlyOwner`) rather than the Transparent proxy pattern:

- Switch `contracts/car_nft_sc.sol` from `@openzeppelin/contracts` to `@openzeppelin/contracts-upgradeable` base contracts (`ERC721URIStorageUpgradeable`, `OwnableUpgradeable`, `UUPSUpgradeable`, `Initializable`). Replace the constructor with an `initialize(...)` function; add a real constructor that only calls `_disableInitializers()` (standard OZ safety pattern so the implementation contract itself can never be initialized directly). Add a storage gap (`uint256[50] private __gap;`) so future upgrades can append state safely.
- Deploy the proxy **manually** via OpenZeppelin's plain `ERC1967Proxy` contract (from `@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol`) rather than depending on the `@openzeppelin/hardhat-upgrades` Hardhat plugin. This project is on Hardhat 3 + ESM (per [[hardhat-3-esm-migration]] in `docs/memory/contracts/`), where plugin compatibility has already bitten once; `ERC1967Proxy` is a plain contract with no HRE plugin dependency, so it sidesteps that risk entirely. Storage-layout safety across upgrades becomes a manual discipline (append-only, never reorder/remove fields) instead of a plugin-enforced check — accepted, and mitigated by the storage gap and an explicit upgrade test.
- `scripts/deploy.js` becomes a one-time bootstrap: deploy `CarRewardToken`, deploy the `VinCidRegistry` implementation, deploy `ERC1967Proxy` pointed at it with `initialize(...)` calldata, and record the **proxy address** (not the implementation address) as `registry` in `deployments/<network>.json` and in `REACT_APP_SMART_CONTRACT_ADDRESS`. A new `scripts/upgrade.js` handles all subsequent upgrades: deploy a new implementation only, call `upgradeToAndCall` on the existing proxy, and re-sync only the ABI (the address never changes again).
- `CarRewardToken` stays a plain, non-upgradeable ERC-20 — out of scope. It is deployed once during bootstrap and never redeployed afterward (upgrades only touch the registry implementation), so its balance/state isn't at risk from this change either.
- The already-live Sepolia `VinCidRegistry` is not itself upgradeable (it predates this ADR), so cutting over is itself a one-time break: the bootstrap deploy starts a fresh proxy with empty storage. **Resolved 2026-07-30:** the user chose to accept this as a one-time data loss rather than write a migration script — see `docs/decisions/2026-07-30-001-accept-sepolia-data-loss-at-cutover.md`.

## Options Considered

### Option A — UUPS proxy, manual `ERC1967Proxy` deployment (chosen)
- **Pros:** Registered data survives every future upgrade with zero per-VIN replay cost; upgrade cost is flat regardless of registry size; no dependency on `@openzeppelin/hardhat-upgrades`, avoiding a repeat of this project's Hardhat 3/ESM plugin-compatibility pain; UUPS needs no separate `ProxyAdmin` contract (cheaper bootstrap than Transparent).
- **Cons:** Every state-changing call pays a small permanent `DELEGATECALL` overhead; contract becomes materially more complex (`initialize` vs constructor, storage-gap discipline, upgrade authorization); storage-layout safety is manual instead of plugin-checked; existing non-upgradeable Sepolia data still needs a one-time decision (accept the loss, or migrate) at cutover.

### Option B — Transparent proxy
- **Pros:** Same data-persistence benefit as UUPS; upgrade authorization lives in a separate `ProxyAdmin` contract, keeping the implementation contract simpler (no `_authorizeUpgrade` to write).
- **Cons:** Requires deploying and managing an extra `ProxyAdmin` contract per registry; slightly higher gas per call than UUPS (extra `ifAdmin` branching in the proxy's fallback); no benefit over UUPS for this project's single-owner, low-complexity access model. Rejected in favor of the cheaper, simpler UUPS pattern.

### Option C — Migration script, keep fresh-deploy-per-release model
- **Pros:** No contract rewrite, no proxy/storage-layout complexity, fits the project's current "every deploy is a clean instance" pattern exactly; no per-call gas tax, ever.
- **Cons:** Migration cost is O(n) in registered VINs — gets more expensive as the registry grows, right when migrating matters most; discards each VIN's original mint-block provenance (the very history ADR 0027 reconstructs from event logs) unless the migration script re-emits synthetic `CidStored` events, which would misrepresent history. Not adopted now, but remains the lower-effort fallback if proxy complexity proves not worth it — see ADR 0027 for the related provenance concern.

## Consequences

- **Positive:** VIN/CID registrations, once bootstrapped behind the proxy, survive every future logic upgrade automatically — "Show all registered NFTs" never goes empty again after an upgrade. The frontend's contract address becomes a set-once value instead of something updated on every deploy.
- **Negative / accepted costs:** Small permanent per-call gas overhead from `DELEGATECALL`. Storage-layout mistakes in a future upgrade are a real risk (manual discipline, not plugin-enforced) — mitigated by a storage gap and a dedicated upgrade test asserting pre-upgrade state survives. The current live Sepolia registrations are not automatically carried into the new proxy by this change alone.
- **Frontend impact:** `REACT_APP_SMART_CONTRACT_ADDRESS` becomes the proxy address, set once; ABI (`contract_abi.json`) still needs re-sync after each upgrade since new logic may add methods. No change to how existing calls are made — the proxy exposes the same function selectors.
- **Contracts impact:** `contracts/car_nft_sc.sol` rewritten to the upgradeable base contracts and an `initialize` pattern; `scripts/deploy.js` becomes bootstrap-only; new `scripts/upgrade.js` for all subsequent upgrades; new upgrade-safety test.
- **Follow-ups:** User approved `autonomous` implementation 2026-07-30, having already resolved the cutover-data question (accept loss, no migration script).

## References

- `contracts/car_nft_sc.sol:16-18` (mappings/array that reset on every fresh deploy — the root problem).
- `scripts/deploy.js` (current fresh-deploy-every-time bootstrap logic to be split into bootstrap vs upgrade).
- `docs/memory/contracts/hardhat-3-esm-migration.md` (prior Hardhat 3/ESM plugin-compatibility pain, motivating the manual `ERC1967Proxy` choice over the `hardhat-upgrades` plugin).
- ADR 0027 (`docs/adr/0027-nft-transaction-provenance-link.md`) — the provenance concern that makes the migration-script option (Option C) lossier than it first appears.
- ADR 0005 (`docs/adr/0005-deploy-script-frontend-sync.md`) — precedent for `scripts/deploy.js` syncing values into `frontend/.env.local`, extended/split here into bootstrap vs upgrade scripts.
