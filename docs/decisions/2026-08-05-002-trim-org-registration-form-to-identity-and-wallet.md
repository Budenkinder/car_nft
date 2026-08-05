---
date: 2026-08-05
scope: frontend
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Trim `OrgRegistrationForm` down to Organization Identity + Wallet only

## Context

Following decision `2026-08-05-001` (which trimmed the form to six sections), the user asked to remove `chamberMembershipNumber`, `coverageExpiry`, `references`, `accuracyConfirmed`, `fraudBanAcknowledged`, `declarationName`, and `declarationDate`. That is every field in "2. Trade Qualification," "3. Insurance," "5. Supporting Evidence," and "6. Declarations" — nothing is left in any of those four sections.

## Decision

`OrgRegistrationForm.jsx` now has exactly two sections: **1. Organization Identity** (legal name, registration number, tax/VAT ID, business address) and **2. Wallet** (address + `personal_sign` challenge, renumbered from 4). Trade Qualification, Insurance, Supporting Evidence, and Declarations are removed entirely, including their `Divider`s. `Checkbox`/`FormControlLabel` imports and the `isValidExpiryDate` validator drop out — nothing left calls them. `org_application.js`'s `buildApplicationEmailBody` matches: two sections in the email body.

## Alternatives Considered

- **Remove the four now-empty sections entirely** *(chosen)* — same reasoning as `2026-08-05-001`: an empty section heading is dead UI.
- **Keep the Declarations section as a bare acknowledgement with no fields** — rejected: not requested, and a checkbox-free "Declarations" heading would be as meaningless as an empty one.

## Consequences

- **Positive:** the application is now two short sections plus a signature — legal name, registration number, tax/VAT ID, address, and the wallet proof. Minimal friction for an applicant.
- **Negative / accepted costs:** the accuracy confirmation and fraud-ban acknowledgement checkboxes are gone — there is no longer an explicit in-form declaration or typed signature beyond the wallet's cryptographic signature. The reviewer now has only identity fields and wallet-control proof to work from; qualification, insurance, and any other vetting happens entirely off-app (email attachments, reviewer follow-up), consistent with decisions `2026-08-03-001`/`002` but now leaning on it more heavily since less structured data reaches the reviewer through the form itself.
- **Follow-ups required:** none — plan 0035 frontend task 5 is amended again in the same change.
