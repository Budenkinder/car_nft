# ADR 0026: Clear the "Create or Update" form fields after a successful new-VIN registration

- **Status:** accepted
- **Date:** 2026-07-28
- **Scope:** frontend
- **Related plans:**
  - `docs/plans/done/0026-clear-form-after-successful-registration-frontend.md`
  - `docs/plans/done/0026-clear-form-after-successful-registration-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-28-013-clear-form-after-successful-registration.md`

## Context

In `frontend/src/App.js`, `handleSubmit` (line 106) drives both the "register a new VIN" (mint) and "update an existing VIN" flows through the same "Create or Update CAR NFT" panel, distinguished by `isNewMint = !vinExistsOnChain`. On success (`result.success`, line 166), the code currently only calls `setTxHash(result.txHash)` — all form fields (`createVin`, `recipient`, `brand`, `model`, `year`, `issue`, `shop`, `mileage`) keep their submitted values. The user wants the register fields cleared once a VIN is **registered** successfully, so the panel is ready for the next car without the operator manually blanking every field.

"Registered" maps to the **new-mint** path specifically (`isNewMint === true`) — the UI already distinguishes this from an update via its button label ("Register New Car NFT" vs. "Submit Repair Update", lines ~450-461) and the user's own wording ("once the vin is registered", not "updated"). The separate VIN **search** field (`vin`, used by "Load Car NFT" / `handleLoadNFT`, distinct state from `createVin`) is not part of the "Create or Update" panel and is out of scope.

## Decision

After a successful `handleNFTCreation` call where `isNewMint` was `true`, reset the "Create or Update" panel's input fields (`createVin`, `recipient`, `brand`, `model`, `year`, `issue`, `shop`, `mileage`) to empty strings, in the same branch that currently calls `setTxHash`. Leave `txHash` itself untouched (it drives the success banner/Etherscan link, not a form input) and leave the update path (`isNewMint === false`) behavior unchanged — an update's fields stay populated after submit, matching current behavior, since the user's request is scoped to registration.

## Options Considered

### Option A — Clear fields only on successful new-mint, leave update path untouched (chosen)
- **Pros:** Matches the literal request ("once the vin is registered"); avoids surprising an operator mid-update-review by wiping fields they might want to re-check or submit again.
- **Cons:** Slight asymmetry between the two paths — acceptable since they're already visually/behaviorally distinct (different button, different required fields).

### Option B — Clear fields on any successful submit (mint or update)
- **Pros:** More uniform behavior.
- **Cons:** Not what was asked; updates are typically iterative (an operator might re-load the same VIN to update again shortly after), so clearing could be more annoying than helpful there. Rejected as scope creep beyond the request.

### Option C — Also reset `vinExistsOnChain`/`vinLastCid` and the separate search `vin` field
- **Pros:** Fully "fresh" panel state, matching what a page reload would look like.
- **Cons:** Not requested ("register fields" refers to the Create/Update panel's own inputs); `vinExistsOnChain` was already `false` at the moment of a successful new mint (that's what made it a new mint), so it needs no reset for the immediate post-submit state — resetting it is a no-op today. Deferred as a non-goal; noted as an Open Question in the plan in case the user wants it too.

## Consequences

- **Positive:** Operator can register the next car without manually clearing 8 fields.
- **Negative:** None material.
- **Frontend impact:** `frontend/src/App.js`'s `handleSubmit` success branch gains a conditional reset; no new state variables, no prop/interface changes.
- **Contracts impact:** None — purely client-side UI state.
- **Follow-ups:** None planned; Option C's broader reset is an open question for the user, not scheduled.

## References

- `frontend/src/App.js:106-175` (`handleSubmit`), `frontend/src/App.js:177-230` (`handleLoadNFT`, shows the separate `vin`/`createVin` state split).
