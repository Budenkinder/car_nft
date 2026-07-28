---
date: 2026-07-28
scope: frontend
status: accepted
related_adr: 0022-document-compensating-unpin-in-readme
supersedes: none
---

# Add a write-flow step documenting the compensating unpin, instead of redrawing the architecture diagram

## Context

User asked whether README's Architecture section is still valid given that a failed VIN creation now removes the pinned CID (ADR 0018's compensating-unpin behavior). Checked: ADR 0018 and its plans never included a README task, so the doc genuinely never caught up — the write flow's happy-path description is accurate but incomplete.

## Decision

Add one new numbered step to the existing "Write flow" list (README's Architecture section), right after the `storeCid` step, describing the unpin-on-failure behavior — matching how the section already documents other conditional behavior (e.g. the reward's silent-failure note). Did not touch the ASCII diagram.

## Alternatives Considered

- **Add a numbered step to the write-flow list (chosen)** — matches existing section style, minimal, precise.
- **Redraw the ASCII diagram with a rollback arrow** — rejected: the diagram is steady-state only by existing convention; every other conditional detail already lives in the numbered text, not the diagram.
- **Leave the README as-is** — rejected: the user explicitly flagged a real doc/behavior mismatch.

## Consequences

- **Positive:** README's write flow now matches shipped behavior; closes a gap ADR 0018 left open.
- **Negative / accepted costs:** None — documentation-only.
- **Follow-ups required:** None beyond plan 0022's single README edit task.
