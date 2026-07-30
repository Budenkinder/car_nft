---
date: 2026-07-29
scope: both
status: proposed
related_adr: 0028-vin-registry-uups-proxy
supersedes: none
---

# Adopt UUPS proxy (manual `ERC1967Proxy`, no `hardhat-upgrades` plugin) over Transparent proxy or a migration script

## Context

Following up on why "Show all registered NFTs" goes empty after a Sepolia redeploy (root cause: every deploy creates a fresh `VinCidRegistry` with empty storage), the user asked how to make an upgrade preserve internal data, then specifically whether a proxy-based upgrade also costs gas. Both a proxy pattern and a migration-replay script were discussed; the user asked for a plan on the proxy approach.

## Decision

Wrote ADR 0028 and a draft plan trio (0028) choosing a UUPS proxy (`UUPSUpgradeable` + `_authorizeUpgrade` gated `onlyOwner`) over the Transparent proxy pattern, and choosing to deploy the proxy manually via OpenZeppelin's plain `ERC1967Proxy` contract rather than the `@openzeppelin/hardhat-upgrades` Hardhat plugin. `scripts/deploy.js` becomes a one-time bootstrap; a new `scripts/upgrade.js` handles every subsequent upgrade without touching the registered proxy address. Plans start in `docs/plans/draft/`, no code changed yet.

## Alternatives Considered

- **UUPS proxy, manual `ERC1967Proxy` (chosen)** — cheaper bootstrap (no separate `ProxyAdmin`), avoids depending on `@openzeppelin/hardhat-upgrades`'s compatibility with this project's Hardhat 3 + ESM setup (which has already caused plugin-compatibility pain once, per `docs/memory/contracts/hardhat-3-esm-migration.md`). Trade-off: storage-layout safety across upgrades is a manual discipline (append-only fields, storage gap) instead of a plugin-enforced check.
- **Transparent proxy** — same data-persistence benefit, but requires a separate `ProxyAdmin` contract and slightly more gas per call; no access-control benefit for this project's single-owner model. Rejected.
- **Migration script, keep fresh-deploy-per-release** — no proxy complexity at all, but cost is O(n) in registered VINs (grows exactly when migrating matters most) and discards each VIN's original mint-block provenance, which ADR 0027 specifically reconstructs from event history. Documented as the lower-effort fallback if proxy complexity isn't worth it, not adopted now.

## Consequences

- **Positive:** Once bootstrapped, the registry's data survives every future upgrade with flat (not per-VIN) cost, and the frontend's contract address becomes set-once instead of updated on every deploy.
- **Negative / accepted costs:** Small permanent per-call `DELEGATECALL` gas overhead; manual storage-layout discipline instead of automated tooling; the already-live (non-upgradeable) Sepolia registry's data is not automatically carried into the new proxy by this change alone.
- **Follow-ups required:** Awaiting user's `implement`/`autonomous` command. Open question left in the contracts plan (task 10): whether to migrate the current live Sepolia registrations into the new proxy at cutover, or accept them as a one-time loss.
