---
date: 2026-08-03
scope: both
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# ADR 0030's access-control half is absorbed into ADR 0035; its plan trio is rejected on 0035's approval

## Context

ADR 0030 (structured vehicle record) already proposed its own role model: a `verifiers` mapping with `setVerifier`, plus tightening `storeCid`'s open-update hole. ADR 0035 proposes an `AccessControl`-based model for the same contract. Shipping both independently would design access control twice, produce two storage appends, and require reconciling them afterwards. The user directed: merge 0030 with the new approach.

## Decision

The **access-control half** of ADR 0030 moves into ADR 0035: `VERIFIER_ROLE` is declared alongside `ORG_ROLE` in the same `AccessControlUpgradeable` model (unused for now), and 0035 closes the open-update hole that 0030 had also flagged.

The **data model half** — `VehicleRecordEntry`, `EntryType`, `addServiceEntry`/`addDocumentEntry`/`addDamageFlag`, `getRecordEntries` — is *not* absorbed. Folding a large new data model into 0035 would turn a focused access-control upgrade into a much riskier change. It returns later as its own trio consuming 0035's roles.

Mechanically: ADR 0030 stays on disk as the record of the analysis; **its plan trio moves to `rejected/` when trio 0035 is approved**, not before — rejecting it now would delete a roadmap item while nothing approved replaces it. Issue #36 closes as not planned with a pointer to 0035. Per §2a, a rejected plan does not change its ADR's status.

## Alternatives Considered

- **Merge access control only, defer the data model** *(chosen)* — resolves the actual overlap the user pointed at, keeps 0035 shippable and reviewable.
- **Merge all of ADR 0030 into 0035** — the literal reading, rejected: one upgrade carrying a new role system, a new storage array, three new write functions, and a verifier concept is a large surface for a first exercise of the upgrade path since ADR 0028's bootstrap.
- **Ship them separately as designed** — rejected by the user's instruction, and it is the scenario that produces two competing role models.

## Consequences

- **Positive:** one role model, defined once, with a place for the verifier concept to land later.
- **Negative / accepted costs:** ADR 0030's data model is deferred with no trio currently tracking it — the roadmap loses a queued item until it is rewritten. `VERIFIER_ROLE` ships dead, which is deliberate but does mean shipping an unused constant.
- **Follow-ups required:** contracts plan 0035 task 14 performs the 0030 rejection and closes #36 on approval. A new trio for the structured vehicle record should be written when the user wants that feature; it must not redefine access control.
