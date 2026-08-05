# ADR 0037: Applicants submit a real on-chain transaction so the application email carries a verifiable, mined transaction hash

- **Status:** accepted
- **Date:** 2026-08-05
- **Scope:** both
- **Related plans:**
  - `docs/plans/done/0037-application-onchain-receipt-frontend.md`
  - `docs/plans/done/0037-application-onchain-receipt-contracts.md`
- **Related decisions:** `docs/decisions/2026-08-03-001-org-application-intake-by-email.md`, `docs/decisions/2026-08-03-002-kyb-documents-stay-off-chain.md`, `docs/decisions/2026-08-05-005-application-includes-onchain-transaction-receipt.md`, `docs/decisions/2026-08-05-006-plan-0037-draft-to-approved.md`, `docs/decisions/2026-08-05-007-plan-0037-approved-to-in-progress.md`, `docs/decisions/2026-08-05-008-plan-0037-in-progress-to-done.md`, `docs/decisions/2026-08-05-009-sepolia-upgrade-and-initializeV2-gap.md`

## Context

ADR 0035's application flow has the applicant sign a `personal_sign` challenge to prove control of the wallet being registered. That signature is entirely off-chain — it never touches the network, produces no transaction, and therefore no transaction hash or block-explorer link exists for it.

The user asked for "the transaction link and id" to be put in the application email, "to ensure that the transaction was successful." Since signing produces no transaction, this request was ambiguous: it could mean (a) present the existing off-chain signature more usefully (e.g., a verification recipe), (b) link to the applicant's wallet address on a block explorer as general context, or (c) have the applicant actually submit a real on-chain transaction. Option (c) has a real cost the other two don't: it requires the applicant to hold network-native ETH and pay gas *before* they are an approved organization, which the current design (decisions `2026-08-03-001`, `-002`) deliberately avoids anywhere else in the intake flow. Clarified directly with the user (`AskUserQuestion`): the answer is (c) — a genuine on-chain transaction.

This has to be reconciled with decision `2026-08-03-002`: "Nothing but the wallet address and its role goes on-chain" for applications. Any design here must not put application content — or even a hash of it — on-chain; low-entropy personal data (legal name, business address) is practically reversible from a hash via dictionary/brute-force, so "just the hash" would not actually satisfy that decision's GDPR-erasure rationale.

## Decision

Add one new, minimal, stateless function to `VinCidRegistry`:

```solidity
event ApplicationSubmitted(address indexed applicant, uint256 timestamp);

function submitApplication() external {
    emit ApplicationSubmitted(msg.sender, block.timestamp);
}
```

No access control — the applicant does not hold `ORG_ROLE` yet, so this must be callable by any wallet. No storage write, no parameters, no application content and no hash of any content: the event carries only `msg.sender` and `block.timestamp`, both already public information the instant the transaction lands. This keeps decision `2026-08-03-002` fully intact — the on-chain footprint is unchanged in kind (still just an address), only in cardinality (one more event type).

The frontend calls `submitApplication()` immediately after the existing `personal_sign` challenge succeeds, as a new required step. It waits for the transaction receipt and only treats it as successful when `receipt.status` confirms the transaction did not revert — a reverted or failed transaction is surfaced as an error and blocks progress to the email step, which is what actually "ensures the transaction was successful" per the user's request. Once confirmed, the transaction hash and a block-explorer link are appended to the application email as a third section, alongside the existing signed-challenge section.

Two proofs now stack, each covering what the other cannot: the signature proves control of the private key without costing anything; the transaction proves the wallet can actually execute a transaction on the target network (holds gas, isn't misconfigured, isn't a burner nobody controls) and gives the reviewer an independently-checkable, timestamped, immutable record — something the current all-off-chain flow cannot offer at all.

Since no new storage is introduced, this ships as an ABI addition on top of the still-unshipped ADR 0035 upgrade (Sepolia deploy for that upgrade has not happened yet, per the standing block on that step) — no new `reinitializer` version is needed, and no second upgrade round is required before Sepolia sees this.

## Options Considered

### Option A — Minimal event-only transaction on `VinCidRegistry` (chosen)
- **Pros:** Reuses the contract and proxy that already exist; no new deployment; no application content or hashes ever touch the chain, so decision `2026-08-03-002` is untouched; trivial gas cost (one event, no storage write); bundles into the upgrade ADR 0035 already needs to ship.
- **Cons:** Requires the applicant to hold a small amount of network-native ETH before applying — a new hard requirement; anyone can call this function independent of the actual email flow (accepted — the caller pays their own gas for a no-op event, not a meaningful attack surface).

### Option B — On-chain hash commitment of the application content
- **Cons:** Rejected outright. Even a one-way hash of low-entropy identifying fields (legal name, business address, registration number) is realistically reversible by dictionary or brute-force search, which would make the "hash-only" record indistinguishable in effect from putting personal data on-chain — exactly what decision `2026-08-03-002` rules out, permanently and irreversibly.

### Option C — A separate, dedicated contract just for this receipt marker
- **Pros:** Fully decoupled from `VinCidRegistry`'s upgrade cadence.
- **Cons:** A second contract and a second deployment for a single stateless event is disproportionate; `VinCidRegistry` is already upgradeable and already the home for every other org-role concern (ADR 0035). Rejected as unnecessary complexity.

### Option D — No on-chain transaction; better-presented signature only (the alternative offered in `AskUserQuestion`, not chosen)
- **Pros:** Zero gas cost to the applicant; fully consistent with the existing all-off-chain design.
- **Cons:** Does not satisfy the user's explicit choice for a real, mined transaction.

## Consequences

- **Positive:** The application email now carries an independently verifiable, mined transaction — a reviewer can open it on a block explorer directly, with no trust placed in the applicant's copy-pasted signature text alone. Confirms the applying wallet can actually transact on the target network before it is ever considered for `ORG_ROLE`.
- **Negative / accepted costs:** The applicant must hold a small amount of network-native ETH before they can complete an application — signing was previously free. This raises the bar for a genuinely new organization with an empty wallet, and is accepted as a v1 trade-off (same spirit as the existing email-based intake being an accepted v1 stopgap, decision `2026-08-03-001`). Anyone can call `submitApplication()` independent of the email flow; harmless (self-funded no-op event) but noted for completeness.
- **Frontend impact:** `OrgRegistrationForm` gains a new required step between signing and the email/submit section; a new util function sends the transaction and waits for a successful receipt; the email template gains a third section with the tx hash and explorer link; the existing "any edit invalidates prior proofs" pattern (added in decision `2026-08-05-003`) extends to this new proof too.
- **Contracts impact:** One new event and one new stateless external function on `VinCidRegistry`, added to the still-unshipped ADR 0035 V2 contract code — no new storage, no new `reinitializer` version, no change to `storeCid` or any existing access control.
- **Follow-ups:** None required immediately. Worth reconsidering later whether to surface a testnet-faucet link when the connected wallet has a zero balance, so the new gas requirement doesn't silently strand an applicant — left as a nice-to-have, not blocking this ADR.

## References

- `docs/adr/0035-org-role-multisig-admin.md` — the application flow this extends.
- `docs/decisions/2026-08-03-001-org-application-intake-by-email.md`, `docs/decisions/2026-08-03-002-kyb-documents-stay-off-chain.md` — the boundaries this decision must respect.
- `docs/decisions/2026-08-05-005-application-includes-onchain-transaction-receipt.md` — records the `AskUserQuestion` clarification that resolved the ambiguous original request.
- `frontend/src/utils/pinata_ipfs_nft_service.js:244-303` (`storeCidOnBlockchain`) — the existing send-transaction-and-await-receipt pattern this reuses.
- `frontend/src/App.js:526-539` — the existing (hardcoded-to-Sepolia) block-explorer link pattern this reuses for consistency.
- **GitHub Issue:** [#44](https://github.com/Budenkinder/car_nft/issues/44)
