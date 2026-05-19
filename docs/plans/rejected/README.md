# Rejected Plans

Terminal state. Plans here were proposed but **not** adopted — either because the user decided against the change after seeing the plan, or because implementation was abandoned mid-way. Preserved for look-back so we can answer "did we already consider this?".

**Entry:** ← any prior state (`draft/`, `approved/`, `in-progress/`) when a plan is shelved.

**Exit:** none. Rejected is terminal. If the idea is revived later, write a new ADR + plan trio with a fresh `NNNN` and link back to the rejected one in the new ADR's "References" section.

Notes on status semantics:

- `rejected` describes the **plan**, not the ADR. An ADR can stay `proposed` (or move to `superseded`) while its plan is `rejected`. These are independent fields.
- When a plan is rejected, the decision log entry recording the rejection must capture **why** — that is the entire point of preserving the artifact.
