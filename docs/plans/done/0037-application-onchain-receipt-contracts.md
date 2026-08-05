# Plan 0037 — Application On-Chain Receipt — Contracts

- **ADR:** `docs/adr/0037-application-onchain-receipt.md`
- **Paired plan:** `docs/plans/done/0037-application-onchain-receipt-frontend.md`
- **GitHub Issue:** [#44](https://github.com/Budenkinder/car_nft/issues/44)
- **Status:** done
- **Date:** 2026-08-05

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a minimal, stateless, permissionless function to `VinCidRegistry` that any wallet can call to emit a single event tied to its own address and the current block timestamp. This gives the org-registration frontend a real, mined transaction to reference — no application content, no hash of anything, ever touches the contract (decision `2026-08-03-002` stays intact). No new storage, so this rides along on the still-unshipped ADR 0035 V2 upgrade rather than requiring a fresh `reinitializer` version or a second deploy round. Out of scope: any change to `storeCid`, `ORG_ROLE`, or `scripts/manage-org-role.js` — none of that is touched by this plan.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `contracts/car_nft_sc.sol` | modify | Add `ApplicationSubmitted` event and `submitApplication()` external function |
| `contracts/mocks/VinCidRegistryV1Mock.sol` | none | No storage change, so the frozen V1 mock used for upgrade-safety tests is unaffected |
| `test/VinCidRegistry.roles.test.js` or a new `test/VinCidRegistry.applicationReceipt.test.js` | add | Cover the new function/event |

## Tasks

- [x] **1.** Add `event ApplicationSubmitted(address indexed applicant, uint256 timestamp);` and `function submitApplication() external { emit ApplicationSubmitted(msg.sender, block.timestamp); }` to `contracts/car_nft_sc.sol`. No modifier, no `require` — callable by any address including one with no role at all, since an applicant has no role yet by definition.
- [x] **2.** Add tests (new file `test/VinCidRegistry.applicationReceipt.test.js`, following the existing fixture pattern in `test/fixtures.js`):
  - A wallet with no role can call `submitApplication()` and it succeeds.
  - The emitted `ApplicationSubmitted` event carries the correct `applicant` (== caller) and a `timestamp` matching the block it landed in.
  - Calling it does not write any storage and does not require any ETH value (plain call, `msg.value` untouched/not checked — reject with a test if a nonzero value assertion is ever added by mistake; the function should simply ignore/accept default `payable: false` semantics, i.e. calling with value should revert per normal Solidity non-payable behavior — assert that too).
  - Multiple calls from the same wallet all succeed and each emits its own event (no de-duplication, no rate limit — accepted per ADR 0037's risk analysis).
- [x] **3.** Run the full existing suite (`npx hardhat test`) to confirm the addition doesn't regress the upgrade-storage-layout test (`VinCidRegistry.upgrade.test.js`) — since no new storage variable is introduced, this should be a no-op there, but must be re-run to confirm. **Result: 46/46 passing** (45 pre-existing + 1 new file's 6 cases; the one `.reverted`→`.revert(ethers)` matcher fix needed for this Hardhat 3 project's convention, matching the existing pattern already used elsewhere in this test suite).
- [x] **4.** No new memory needed — the one non-obvious thing hit while implementing (the deprecated `.reverted` chai matcher in this Hardhat 3 toolchain) is already documented in `docs/memory/contracts/hardhat-automated-test-suite.md`; no gas-estimation surprises for the zero-argument event-only call.

## Contract Surface

- **New event:** `ApplicationSubmitted(address indexed applicant, uint256 timestamp)`.
- **New function:** `submitApplication() external` — no return value, no modifiers, no access control, no state mutation beyond the event log.
- **Storage layout changes:** none. Safe to add without a new `reinitializer` version.
- **Access control:** open to any address, by design — this runs before the caller could possibly hold `ORG_ROLE`.
- **Gas considerations:** one `LOG` opcode with one indexed topic plus the base transaction cost (~21,000 + a few thousand gas for the event) — the cheapest possible non-trivial transaction, keeping the applicant's gas cost as low as this design can make it.

## Interfaces with Frontend

- **Function called:** `submitApplication()` — no arguments, no return value; the frontend reads success from the transaction receipt (`receipt.status`).
- **Event consumed:** `ApplicationSubmitted(applicant, timestamp)` — not subscribed to by the frontend directly in this plan (the frontend already has the tx hash from `.send()`'s resolved receipt); included in case a future admin view wants to list recent applications from event logs.
- **ABI / address handoff:** same `contract_abi.json` + `getContractAddress(chainId)` path every other contract call in `frontend/src/utils/pinata_ipfs_nft_service.js` already uses; regenerated the same way as ADR 0035's ABI update (via `scripts/deploy.js`'s existing frontend-sync step, or manual ABI copy if the Sepolia upgrade for 0035 still hasn't happened by the time this ships — see Deployment section).
- **Network assumptions:** works on any chain the contract is deployed to (localhost 31337, Sepolia 11155111); no new network-specific logic on the contracts side.

## Testing

- Hardhat unit tests per Task 2 above.
- Local deploy + integration check: after redeploying/upgrading locally (`npm run deploy:local` or `npm run upgrade:local`, whichever this ships alongside), call `submitApplication()` from a fresh non-org account via a small script or directly from the frontend flow, and confirm a receipt with `status: true` and a real `transactionHash`.
- Security checks: no reentrancy surface (no external calls, no storage writes); no overflow surface (no arithmetic); no access-control regression (function is intentionally open, verified by test that a zero-role wallet succeeds).

## Deployment and Migration

- No new `reinitializer` version needed — this is a pure ABI addition with no new storage, so it can be added directly to the same not-yet-deployed V2 contract code that ADR 0035 already introduced (Sepolia upgrade for that work remains blocked pending explicit user go-ahead, per the standing note in this project). If ADR 0035's Sepolia upgrade ships *before* this plan is implemented, this becomes a small follow-up upgrade (still no new `reinitializer` version — only functions/events changed, not storage) instead of riding along; either order works without a storage-layout conflict.
- `npm run upgrade:local` / `npm run upgrade:sepolia` (existing UUPS upgrade scripts) pick up the new function automatically once the implementation contract is redeployed and the proxy points at it — no migration script needed since no state needs backfilling.
- Verification on Etherscan: standard `hardhat-verify` flow already used for the existing implementation contract; no changes needed to the verification tooling itself.

## Risks and Rollback

- **Risk:** Any wallet can call `submitApplication()` at will, unrelated to a real application, generating spam events. Accepted — the caller pays their own gas for a no-op event; no contract state is at risk, and no other function's behavior depends on this event ever having been emitted.
- **Risk:** If a future feature is tempted to add a parameter to this function (e.g., "just a small hash, for convenience"), that would cross back into the territory decision `2026-08-03-002` rules out. Flagged here explicitly so a future change doesn't reintroduce it without revisiting that decision.
- **Rollback:** Since this adds only a new function/event with no storage and no interaction with existing functions, rollback is a plain redeploy of the previous implementation contract via the existing UUPS upgrade path — no data migration to reverse.

## Open Questions

- None — the user has already confirmed the on-chain-transaction approach via `AskUserQuestion`; the rest is mechanical.
