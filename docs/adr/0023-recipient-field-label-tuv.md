# ADR 0023: Relabel the recipient input from "Car Owner Wallet" to "TÜV Car Inspection Wallet Address"

- **Status:** accepted
- **Date:** 2026-07-28
- **Scope:** frontend
- **Related plans:**
  - `docs/plans/in-progress/0023-recipient-field-label-tuv-frontend.md`
  - `docs/plans/in-progress/0023-recipient-field-label-tuv-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-28-008-recipient-field-label-tuv.md`

## Context

The mint form's recipient `TextField` at [App.js:383](../../frontend/src/App.js#L383) is currently labeled `"Car Owner Wallet (recipient)"`. In the previous support exchange in this session, a user typed a person's name ("Christian Mustermann") into this field instead of a wallet address, triggering the `Web3.utils.isAddress` validation error. The label's wording ("Car Owner") reinforces the idea that the field wants an owner's *identity*, not a wallet address.

The user has now clarified the actual real-world role behind this field: it is not necessarily the car's owner who receives the NFT, but a TÜV (German vehicle inspection authority) representative's wallet. The label should reflect that role and reinforce "wallet address" more explicitly to reduce future input errors of this kind.

This is a copy-only change to a single JSX label string. It does not touch validation logic, state, or the on-chain call.

## Decision

Change the `label` prop of the recipient `TextField` in `frontend/src/App.js` from `"Car Owner Wallet (recipient)"` to `"TÜV Car Inspection Wallet Address (recipient)"`. No other logic, validation, helper text, or variable naming changes.

## Options Considered

### Option A — Relabel only the visible `label` string (chosen)
- **Pros:** Minimal, isolated, zero behavioral risk; directly satisfies the request.
- **Cons:** Internal identifiers (`recipient`, `errors.recipient`, related helper/error copy) still say "Car owner" — slight naming inconsistency between UI copy and code/comments.

### Option B — Also rename internal state/variable names (`recipient` → `tuvWallet`, etc.)
- **Pros:** Full naming consistency between UI and code.
- **Cons:** Touches state, validation, and the `handleNFTCreation` call signature for no functional gain; expands blast radius and review surface well beyond what was requested; risks regressions in a payment/minting path.

### Option C — Also update the helper text under the field
- **Pros:** Reinforces "wallet address" language beyond just the label, addressing the root confusion more thoroughly.
- **Cons:** Not requested; helper text already says "Wallet address that will receive the NFT" which is already accurate and unambiguous.

## Consequences

- **Positive:** Field label now matches the real-world role (TÜV inspection wallet) the user described, reducing the odds of someone entering a person's name again.
- **Negative:** None material — pure copy change.
- **Frontend impact:** One JSX string literal changes in `frontend/src/App.js`. No prop, state, or handler signature changes.
- **Contracts impact:** None. The `recipient` argument passed to the contract call is unchanged in type and meaning (still expects a wallet address).
- **Follow-ups:** None planned. Option B (deeper renaming) can be revisited later as its own ADR if the team wants full naming consistency.

## References

- Prior conversation in this session: "Recipient must be a valid wallet address" validation error, traced to [pinata_ipfs_nft_service.js:179](../../frontend/src/utils/pinata_ipfs_nft_service.js#L179).
