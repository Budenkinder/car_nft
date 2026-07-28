---
date: 2026-07-28
scope: frontend
status: proposed
related_adr: 0026-clear-form-after-successful-registration
supersedes: none
---

# Clear "Create or Update" form fields after a successful new-VIN registration, not after updates

## Context

User asked: once a VIN is registered successfully, the register fields should be cleaned up. `handleSubmit` in `frontend/src/App.js` handles both new-mint registration and update-existing-VIN through the same form/state, distinguished by `isNewMint`. Needed to decide whether "registered" means only the new-mint path or also updates, and whether to reset.

## Decision

Wrote ADR 0026 and a draft plan trio (0026) scoping the clear-on-success behavior to the new-mint path only (`isNewMint === true`), leaving the update path's post-submit behavior unchanged, and leaving `txHash` (success banner) and the separate VIN-search field untouched. Plans start in `docs/plans/draft/`, pending the user's `implement`/`autonomous` command — no code changed yet.

## Alternatives Considered

- **Clear fields on any successful submit (mint or update)** — rejected as scope creep beyond "once the vin is registered"; updates are more likely to be iterative and an operator may want the fields to stay.
- **Also reset `vinExistsOnChain`/`vinLastCid`/the search `vin` field for a fully fresh panel** — deferred as an open question in the plan rather than assumed; not explicitly requested, and `vinExistsOnChain` is already `false` at the moment of a successful new mint so it needs no reset for the immediate post-submit UI state.

## Consequences

- **Positive:** Once implemented, registering a new VIN successfully will clear the 8 form fields, matching the request.
- **Negative / accepted costs:** Update flow keeps requiring manual clearing if the user later wants that too — treated as a separate, unconfirmed ask.
- **Follow-ups required:** Awaiting user's `implement`/`autonomous` command to execute plan 0026.
