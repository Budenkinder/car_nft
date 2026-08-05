---
date: 2026-08-05
scope: frontend
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Auto-scroll the Submit section into view after signing in `OrgRegistrationForm`

## Context

User report: "open mail for submit button is missing or at least invisible." Reproduced live via the headless-Chromium harness (viewport 1280x800, no manual scrolling): the "Sign challenge with MetaMask" button sits near the bottom of the visible area. After a successful sign, the new "Submit" section — including the "Open email to submit" and "Copy application text" buttons — renders entirely below the fold. React doesn't scroll the page when new content is appended, so the user sees the green "Signed..." confirmation and then nothing; the buttons exist, are correctly styled, and have a valid `href`, but are outside the viewport with no visual cue that more content appeared below. This reads as "the button is missing," not "scroll down."

Confirmed the button itself was never actually broken: `mailtoHref` computed correctly (valid non-empty `href`, `isVisible()` true, correct bounding box) in every reproduction — the defect is purely that nothing tells the user to scroll.

## Decision

Added a `ref` (`submitSectionRef`) on the `Box` wrapping the Submit section, and a `useEffect` keyed on `signature` that calls `submitSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" })` once `signature` becomes truthy. This runs exactly once per successful sign (the effect only fires on the `signature` transition), scrolling the newly-revealed section into view automatically.

Re-verified live via the same headless-Chromium harness: captured a viewport-only (non-fullPage) screenshot immediately after signing, no manual scroll. Before the fix, the visible viewport ended mid-way through the "Legal name" helper text and the Submit section was fully off-screen. After the fix, the same screenshot shows the "Open email to submit" and "Copy application text" buttons fully visible without any user scroll action.

## Alternatives Considered

- **Auto-scroll to the Submit section on sign success** *(chosen)* — directly fixes the reported symptom; minimal, localized change; matches this session's pattern of fixing correctness/UX bugs found in this form in place rather than opening a new ADR/plan trio, since plan 0035 is still `in-progress`.
- **Move the Sign button to open the wallet's own popup fully in view / shrink the form** — would require restructuring the whole form's layout; unnecessary for a single-cause fix.
- **Do nothing and rely on the user scrolling** — rejected; this is exactly the reported bug, "do nothing" is not a fix.

## Consequences

- **Positive:** the submit buttons are now guaranteed visible immediately after signing, without relying on the user to discover they must scroll.
- **Negative / accepted costs:** none identified — `scrollIntoView` is a widely supported browser API; the smooth-scroll behavior is a minor visual nicety, not a hard dependency (an unsupported browser simply jumps instantly, which is still correct).
- **Follow-ups required:** none.
