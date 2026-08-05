# Plans

Two plan files per request — one for the frontend, one for the contracts — both sharing the same `NNNN-<slug>` as their ADR in `docs/adr/`.

Plan files live in a **subfolder named after their status**:

| Folder | Meaning |
|--------|---------|
| [`draft/`](draft/) | Written but not yet approved. New plans start here. Templates live here. |
| [`approved/`](approved/) | User-approved, not yet started. |
| [`in-progress/`](in-progress/) | Implementation has started. |
| [`done/`](done/) | All tasks complete. Terminal. |
| [`rejected/`](rejected/) | Proposed but not adopted. Terminal. Preserved for look-back. |

Filenames:

- `NNNN-<slug>-frontend.md` — use [`draft/_template-frontend.md`](draft/_template-frontend.md)
- `NNNN-<slug>-contracts.md` — use [`draft/_template-contracts.md`](draft/_template-contracts.md)

Every trio entering [`approved/`](approved/) gets a GitHub tracking issue in `Budenkinder/car_nft`, linked from both plan files as `**GitHub Issue:** [#NN](…)` and from the ADR's `## References`; the issue is closed when the trio reaches `done/` or `rejected/`. An issue filed earlier (while still in `draft/`) is reused, not duplicated. See repo-root [`CLAUDE.md`](../../CLAUDE.md) section **2a** for the normative rule.

Both files must exist for every request. If one side has no changes, the file still exists and states "no changes required" with a one-line justification. Numbering is **global** across all status folders.

On every status transition, both plans in a trio move together (`git mv`), their frontmatter and paired-plan paths update, and the matching ADR's `Related plans:` paths are rewritten in the same change. See repo-root [`CLAUDE.md`](../../CLAUDE.md) section **2a. Plan statuses and folders** for the full workflow.
