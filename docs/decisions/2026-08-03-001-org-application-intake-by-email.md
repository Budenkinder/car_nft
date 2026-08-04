---
date: 2026-08-03
scope: frontend
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Organization applications are collected in the browser and submitted by email — no backend, no queue

## Context

The onboarding flow needs somewhere for applications to land before a reviewer checks them and the Safe grants `ORG_ROLE`. The design conversation assumed "a review queue (off-chain DB)". This repo has no backend at all — a React SPA, Pinata, and the chain — so that queue would have to be invented. Three options were put to the user: a form/email service, a real serverless backend with a database, or IPFS with an on-chain pointer.

## Decision

Collect the application in the browser and submit it as a prefilled email (`mailto:`), with KYB documents attached by the applicant to that email. The user chose this over building a backend.

No application data is stored by this system at any point. The reviewer's inbox is the queue.

## Alternatives Considered

- **Email / form service** *(chosen)* — zero new infrastructure, nothing to operate, and no personal data ever enters this project's storage.
- **Serverless functions + a database (Vercel + Supabase)** — a real queue with status tracking, but it adds a **third side** to a repo whose entire structure (CLAUDE.md's two-plan rule, `docs/memory/{frontend,contracts}`) assumes exactly two. Disproportionate before a single application has been received.
- **IPFS + on-chain pointer** — fits the web3 instinct and is the worst option available: it would publish KYB documents irreversibly and world-readably. Ruled out by `2026-08-03-002`.

## Consequences

- **Positive:** ships with the frontend alone; no operating cost; no PII in this codebase.
- **Negative / accepted costs:** no queue, no audit trail, no status visibility for applicants, no SLA. It will not survive more than a handful of applicants. Explicitly a v1 stopgap.
- **`mailto:` may truncate** long bodies (~2,000 characters in several clients) and this body will be long. Plan 0035's frontend task 7 requires a real-browser check, with a copy-to-clipboard fallback if it truncates.
- **Follow-ups required:** the receiving inbox is now in GDPR scope (retention, deletion on request, access control) even though this codebase stores nothing. The user needs a dedicated address, not a personal one — it ships public in the JS bundle and will attract spam.
