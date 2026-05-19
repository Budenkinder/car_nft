# Memory Index

This is the index of all repo-tracked memory. Every memory file under `docs/memory/frontend/` or `docs/memory/contracts/` must have a one-line entry here.

**Memory location is fixed:** project memory lives only under `docs/memory/`. Never write to `.claude/` or `~/.claude/`.

Format: `- [Title](relative/path.md) — one-line hook`

> Do not write memory content in this file. This file is an index only.
> Keep this file under ~200 lines; if it grows past that, the index is being misused.

## Frontend (`docs/memory/frontend/`)

- [Plans live in status-named subfolders](frontend/plan-status-folders.md) — draft/approved/in-progress/done/rejected; both plans in a trio move together when status changes (per ADR 0002).

## Contracts (`docs/memory/contracts/`)

_No entries yet._
