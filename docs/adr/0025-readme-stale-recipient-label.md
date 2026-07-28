# ADR 0025: Sync README's "Using the app" step with the current recipient field label

- **Status:** accepted
- **Date:** 2026-07-28
- **Scope:** frontend
- **Related plans:**
  - `docs/plans/in-progress/0025-readme-stale-recipient-label-frontend.md`
  - `docs/plans/in-progress/0025-readme-stale-recipient-label-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-28-012-readme-stale-recipient-label.md`

## Context

ADR 0023 changed the mint form's recipient `TextField` label in `frontend/src/App.js` from `"Car Owner Wallet (recipient)"` to `"TÜV Car Inspection Wallet Address (recipient)"`. `README.md`'s "Using the app" walkthrough (line 273, step 3) still references the old label: `Fill in VIN, **Car Owner Wallet (recipient)**, brand, model, year, issue, repair shop, mileage, ...`. This was flagged as an explicit non-goal in ADR 0024 and left for the user to request separately — they've now asked for it.

## Decision

Update `README.md:273` to say `**TÜV Car Inspection Wallet Address (recipient)**` instead of `**Car Owner Wallet (recipient)**`, matching the live UI exactly. No other wording in that step changes.

## Options Considered

### Option A — Update the bolded field name only, in place (chosen)
- **Pros:** Minimal, isolated, brings the doc back in sync with the UI; matches the style already used for the other field names in the same numbered step.
- **Cons:** None material.

### Option B — Rewrite the whole step for extra clarity (e.g. explain the TÜV role)
- **Pros:** Could add more context on why the field is called that.
- **Cons:** Not requested; the field's helper text in the app already explains it's "the wallet address that will receive the NFT"; scope creep beyond a label sync.

## Consequences

- **Positive:** README's walkthrough now matches the actual UI, avoiding the exact "typed a name instead of an address" confusion from earlier in this session.
- **Negative:** None material.
- **Frontend impact:** Documentation only; no application code changes (the code already has the new label since ADR 0023).
- **Contracts impact:** None.
- **Follow-ups:** None.

## References

- ADR 0023 (`docs/adr/0023-recipient-field-label-tuv.md`) — introduced the new label.
- ADR 0024 (`docs/adr/0024-readme-crt-metamask-import.md`) — flagged this staleness as an explicit non-goal, deferred to a separate request.
