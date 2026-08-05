---
date: 2026-08-05
scope: frontend
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Trim `OrgRegistrationForm` down to legal name, registration number, tax/VAT ID, business address, chamber membership number, coverage expiry, wallet, references, and declarations

## Context

The user asked to remove `foundedDate`, `craftsmanCertificate`, `specialization`, `insuranceProvider`, `policyNumber`, and the entire Contact Person section (`contactName`, `contactRole`, `contactEmail`, `contactPhone`), plus `website`, from the org registration form plan 0035 (frontend) task 5 built. Plan 0035 is already `in-progress` (implementation underway, contracts side done, frontend built and manually verified in the prior session) — this is a scope reduction to a form already built, not a new feature.

## Decision

`OrgRegistrationForm.jsx`'s field set narrows to: legal name, registration number, tax/VAT ID, business address (section 1); chamber membership number (section 2, now the only field — `craftsmanCertificate` and `specialization` removed); coverage expiry (section 3, now the only field — `insuranceProvider` and `policyNumber` removed); wallet address + signature (section 4, renumbered from 5); references only (section 5, renumbered from 6 — `website` removed); declarations (section 6, renumbered from 7). **Section "4. Contact Person" is removed entirely** — all four of its fields were on the removal list, leaving nothing to keep it for.

`org_application.js`'s `buildApplicationEmailBody` drops the same fields and the Contact Person block, renumbering the remaining sections to match. `validation.js` drops `isValidEmail`/`emailRegex` — their only caller (`contactEmail`) is gone, so keeping them would be dead code.

Plan 0035 (frontend) task 5 is amended in place to describe the trimmed field set, per CLAUDE.md §5 ("if a plan step turns out to be wrong, stop and propose an amendment to the plan rather than silently diverging") — this is implementation still in progress, not a completed step being reopened.

## Alternatives Considered

- **Amend plan 0035 in place** *(chosen)* — the plan is still `in-progress`; the trio isn't `done`, so there's no completed record to preserve untouched. A new ADR/plan trio for a field-list edit to an unfinished form would be disproportionate ceremony.
- **Leave "4. Contact Person" as an empty section header** — rejected: a section with no fields is dead UI, confusing to an applicant.

## Consequences

- **Positive:** shorter form, fewer required fields, less to validate and less that can go wrong in the `mailto:` body length. `chamberMembershipNumber` and `coverageExpiry` still give a reviewer something concrete to check without asking for provider/policy names or a certificate reference number.
- **Negative / accepted costs:** the application now captures less than the original design conversation's stated shape (ADR 0035's Context section references qualification/insurance/contact detail generally, not by field name, so nothing there needs updating) — a human reviewer has less structured data to work with and may need to ask applicants for missing detail (contact person, insurance provider) over email during review. Accepted as the user's explicit choice.
- **Follow-ups required:** none — plan 0035 frontend task 5 is updated in place; no other task references these fields.
