---
date: 2026-07-28
scope: frontend
status: accepted
related_adr: 0023-recipient-field-label-tuv
supersedes: none
---

# Relabel recipient field to "TÜV Car Inspection Wallet Address (recipient)"

## Context

Earlier in this session a user hit a "Recipient must be a valid wallet address" validation error after typing a person's name into the mint form's recipient field, which was labeled "Car Owner Wallet (recipient)". The user then clarified the field's real-world role is a TÜV (German vehicle inspection authority) wallet, not necessarily the car owner, and asked for the label to be changed accordingly to reduce ambiguity.

## Decision

Change only the `label` prop of the recipient `TextField` in `frontend/src/App.js` (line 383) from `"Car Owner Wallet (recipient)"` to `"TÜV Car Inspection Wallet Address (recipient)"`. Leave the underlying `recipient` state/prop names, validation logic, and helper/error text untouched — scope is copy-only, per ADR 0023 Option A.

## Alternatives Considered

- **Copy-only label change (chosen)** — minimal, zero behavioral risk, directly satisfies the request.
- **Also rename internal identifiers** (`recipient` → `tuvWallet`, etc.) — rejected as out of scope; expands review surface into a minting code path for no functional gain.
- **Also rewrite helper text** — rejected as unnecessary; helper text already correctly says "Wallet address that will receive the NFT".

## Consequences

- **Positive:** Label now matches the real-world role behind the field, reducing future mis-entries like the one that triggered this conversation.
- **Negative / accepted costs:** None material.
- **Follow-ups required:** None. Deeper naming consistency (state/prop renames) can be proposed later as its own ADR if desired.
