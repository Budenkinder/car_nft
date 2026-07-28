# Plan 0012 — Document session learnings in README — Contracts

- **ADR:** `docs/adr/0012-readme-session-learnings.md`
- **Paired plan:** `docs/plans/done/0012-readme-session-learnings-frontend.md`
- **Status:** done
- **Date:** 2026-07-20

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a "No contracts to compile" entry to `README.md`'s "Troubleshooting" section, explaining that this message is Hardhat 3's normal "already up to date" response — not an error — and pointing to `npx hardhat clean && npm run compile` for a genuine forced rebuild. This documents ADR 0009/0010's corrected diagnosis where a contributor will actually see it.

Out of scope: any Hardhat config, script, or dependency change (no remediation of `npm audit` findings — deferred by the user).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `README.md` | modify | Add a `No contracts to compile` bullet to the "Troubleshooting" section. |

## Tasks

- [x] **1.** Add a bullet to `README.md`'s "Troubleshooting" section: `No contracts to compile` means the build is already up to date (every `.sol` file has a valid cache hit) — not an error, not evidence contracts weren't found. To force a full rebuild, run `npx hardhat clean && npm run compile`.

## Contract Surface

No changes.

## Interfaces with Frontend

None.

## Testing

- Manual: proofread the rendered Markdown after the edit.

## Deployment and Migration

Not applicable.

## Risks and Rollback

- Risk: none — documentation only.
- Rollback: revert the `README.md` diff.

## Open Questions

None.
