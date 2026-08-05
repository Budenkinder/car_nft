---
date: 2026-08-03
scope: both
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# KYB documents never touch IPFS or the chain; only the wallet address and its role go on-chain

## Context

The application collects craftsman certificates, insurance policies, tax and VAT identifiers, business registration numbers, and named contact people with phone numbers. The instinctive web3 answer is to pin them to IPFS and anchor a hash on-chain.

That instinct produces the worst possible outcome here. IPFS pinning is irreversible and world-readable; unpinning does not erase copies already cached by gateways and peers. GDPR erasure rights cannot be honoured against public immutable storage, and this is exactly the category of data those rights exist for.

## Decision

Nothing but the **wallet address and its role** goes on-chain. KYB documents and personal data stay entirely off-chain — attached to the application email, reviewed by a human, never stored by this system. Not the documents, not hashes of them, not a "redacted summary".

## Alternatives Considered

- **Off-chain only, wallet + role on-chain** *(chosen)* — the only option compatible with erasure rights.
- **Documents on IPFS, hash on-chain** — the hash alone is defensible; the documents on a public gateway are not. Rejected.
- **Encrypted documents on IPFS** — moves the problem to key management and still leaves ciphertext permanently public, vulnerable to future key compromise. Rejected as disproportionate for data a reviewer reads once.

## Consequences

- **Positive:** the contract holds no personal data, so no on-chain state can ever become a compliance liability. Verification stays a human judgment about paperwork, which is what it actually is.
- **Negative / accepted costs:** no on-chain evidence of *why* an organization was approved. The audit trail is the Safe transaction plus whatever the reviewers kept — deliberately outside the system.
- **Follow-ups required:** any future feature proposing to publish organization details (a public directory of approved shops, for instance) must be checked against this decision first. See ADR 0036's real-paywall branch, which raises a related question from the opposite direction.
