---
date: 2026-08-05
scope: frontend
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Code review of `OrgRegistrationForm.jsx`: fixed a stale-wallet-address bug, an unmount race, stale UI messages, and untrimmed signed content

## Context

Requested code review of `OrgRegistrationForm.jsx` after two rounds of field trimming (decisions `2026-08-05-001`, `-002`). Reading it end to end surfaced four real issues, not just style nits.

## Decision

Fixed in place:

1. **Stale wallet address.** `fields.walletAddress` was seeded from the `walletAddress` prop only inside `useState`'s initializer, which runs once. Switching MetaMask accounts while the registration page was open left the field pointing at the wallet that was connected when the page opened — the "must match your connected wallet" validation would then fail against a wallet the user could no longer easily identify as wrong. Added a `useEffect` keyed on `walletAddress` that re-syncs the field and clears any existing signature/challenge (a switched account invalidates a prior signature anyway).
2. **Unmount race.** `handleSign` awaits a `personal_sign` prompt; clicking "Back" while it's pending would call `setIsSigning`/`setSignature`/`setErrors` after unmount. Added an `isMountedRef` guard, checked before each state update following the `await`.
3. **Stale UI state.** Editing a field after copying the application text, or after a "signature rejected" error, left `copyStatus` / `errors.general` displayed even though they no longer applied. Both now clear on any field edit.
4. **Untrimmed signed content.** `fields.legalName` (and the other text fields) were used as-typed, including stray leading/trailing whitespace, in both the `personal_sign` challenge message and the email body — so the cryptographically signed message could carry whitespace differences invisible to the user. Values are now trimmed at the point of use (challenge construction, email body), without trimming the input fields themselves while the user is typing.

Also removed an unused `catch (error)` binding in `handleCopy` (optional catch binding, no functional change).

Re-verified via the same headless-Chromium harness used for prior manual verification passes: filled the form, confirmed the wallet field pre-fills to the connected account, signed, simulated a MetaMask `accountsChanged` event mid-session, and confirmed the wallet field updated and the stale signature cleared. Confirmed the email body contains the trimmed legal name. Confirmed no console errors/crashes clicking "Back" immediately after triggering a sign.

## Alternatives Considered

- **Fix in place** *(chosen)* — these are correctness bugs in code from this same in-progress plan, not a design change; no new decision-worthy trade-off beyond documenting what was wrong and why.
- **Make the wallet field read-only, always mirroring the connected wallet** — would have sidestepped the sync bug differently (no editable field to go stale), but changes the field's existing intentional design (user can type an address before connecting the matching wallet). Left as a possible future simplification, not applied here since it wasn't the reported bug.

## Consequences

- **Positive:** an account switch mid-application no longer leaves the form in a confusing, silently-wrong state. No more possible unmount warnings/crashes. No more stale success/error banners.
- **Negative / accepted costs:** none.
- **Follow-ups required:** none.
