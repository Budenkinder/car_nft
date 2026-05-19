# CLAUDE.md

Project guidance for Claude Code when working in this repository.

## No Exceptions

The rules below are **mandatory** and apply to every request, every turn, every task — including small fixes, typo corrections, one-line tweaks, exploratory questions that lead to changes, and follow-ups inside an ongoing task. There are no "trivial enough to skip the ADR/plans/memory/decision log" cases.

If a request seems too small for the full workflow, the answer is to write *small* artifacts, not to skip them. If you ever find yourself reasoning "this is a minor change so I'll just edit the file" — stop and do the ADR + plans + decision log first. If something blocks you from following a rule, surface the blocker to the user instead of working around it.

**Memory location is non-negotiable:** all project memory is written to `docs/memory/` only. The `.claude/` / `~/.claude/` auto-memory directory must never be used for this project. If any tool or default behavior tries to route a memory write there, redirect it to `docs/memory/<frontend|contracts>/`.

## Repository Layout

- `frontend/` — React-based Web3 UI (the FE).
- `contracts/` — Solidity smart contracts on Ethereum (the backend).
- `scripts/`, `hardhat.config.js`, `deployments/` — Hardhat tooling and deploy artifacts.

The frontend and contracts are tightly coupled: contract ABIs, addresses, and events drive the UI. Treat them as one product with two sides.

## Workflow Rules

### 1. Always start with ADR + Plans

For **every** request the user makes (feature, fix, refactor, investigation that leads to changes), produce all three artifacts before writing any code:

- **ADR** (Architectural Decision Record) — captures the decision, context, options considered, and trade-offs.
- **Frontend Plan** — concrete plan for changes in `frontend/`.
- **Contracts Plan** — concrete plan for changes in `contracts/` (and any Hardhat scripts/deployments).

Save these under `docs/adr/` and `docs/plans/<status>/` using sequential numbering and short kebab-case slugs:

- `docs/adr/NNNN-<slug>.md`
- `docs/plans/<status>/NNNN-<slug>-frontend.md`
- `docs/plans/<status>/NNNN-<slug>-contracts.md`

`<status>` is one of `draft | approved | in-progress | done | rejected`. New plans always start in `docs/plans/draft/`. See section **2a. Plan statuses and folders** below for the folder rules and transition workflow.

Use the same `NNNN-<slug>` across the trio so the ADR and its two plans are easy to find together. Plan numbering is **global** across all status folders — never reset per folder.

### 2. Plan both sides together

Never plan only the frontend or only the contracts. Even if a request appears to touch one side, write the plan for the other side too — at minimum stating "no changes required" with a one-line justification (e.g., "ABI unchanged, no new events consumed").

Each plan must include:

- Scope and goals
- Files to add/modify (with paths)
- Step-by-step tasks in execution order, each small enough to implement and review independently
- Interfaces between frontend and contracts (function signatures, event shapes, address/ABI handoff)
- Testing approach (Hardhat tests for contracts, frontend tests/manual verification for UI)
- Risks and rollback notes

### 2a. Plan statuses and folders (STRICT)

Plan files are **segregated by status** into subfolders under `docs/plans/`. The directory tree itself answers "what's still open, what shipped, what we walked away from".

The five statuses and their folders:

| Status        | Folder                       | Meaning                                                                       | Terminal? |
|---------------|------------------------------|-------------------------------------------------------------------------------|-----------|
| `draft`       | `docs/plans/draft/`          | Written but not yet approved. New plan trios start here.                      | no        |
| `approved`    | `docs/plans/approved/`       | User has approved the plan; implementation not yet started.                   | no        |
| `in-progress` | `docs/plans/in-progress/`    | Implementation has started; task checklist is being ticked off.               | no        |
| `done`        | `docs/plans/done/`           | Every task complete and the matching code merged. Preserved for look-back.    | **yes**   |
| `rejected`    | `docs/plans/rejected/`       | Proposed but **not** adopted (decided against, or abandoned mid-way). Preserved for look-back. | **yes** |

Rules — **strict**, not optional:

- **Frontmatter `Status:` is the source of truth.** The folder mirrors it. If they disagree, the frontmatter wins — move the file to match.
- **Both plans in a trio share a folder.** The `-frontend.md` and `-contracts.md` for the same `NNNN` always live in the same status folder, and they move together on every transition — even if one side is a no-op.
- **Templates live only in `draft/`.** `docs/plans/draft/_template-frontend.md` and `docs/plans/draft/_template-contracts.md` are the only template copies. Don't duplicate them into other status folders.
- **Numbering is global.** `NNNN` increments across **all** plans regardless of folder. The `NNNN` lookup from ADR to plans always works.
- **Status transitions are a multi-file change.** Every transition is:
  1. `git mv docs/plans/<old-status>/NNNN-<slug>-frontend.md docs/plans/<new-status>/NNNN-<slug>-frontend.md`
  2. `git mv docs/plans/<old-status>/NNNN-<slug>-contracts.md docs/plans/<new-status>/NNNN-<slug>-contracts.md`
  3. Update both plan files' frontmatter `Status:` field to match the new folder.
  4. Update both plan files' `**Paired plan:**` path to the new folder.
  5. Rewrite the matching ADR's `Related plans:` paths to point at the new folder.
  6. Write a decision log entry recording the transition (see section 4). The decision log entry is the checkpoint where stale links get caught.
- **`rejected` is independent of ADR status.** A plan in `rejected/` does **not** force the ADR to `superseded`. It is valid for an ADR to stay `proposed` (or `accepted`) while its plan is `rejected` — that combination means "we considered this and decided not to ship".
- **Look-back lives in `done/` and `rejected/`.** `ls docs/plans/done/` answers "what shipped"; `ls docs/plans/rejected/` answers "what did we walk away from and why". There is no separate archive system.

### 3. Project memory (STRICT)

Maintain repo-tracked memory under `docs/memory/`, split by side:

- `docs/memory/frontend/` — memory scoped to the React Web3 UI.
- `docs/memory/contracts/` — memory scoped to the Solidity contracts / Hardhat backend.
- `docs/memory/MEMORY.md` — single index file listing every memory file in both subfolders, one line each.

**The `.claude/` folder is OFF LIMITS for memory.** Never write project memory to `.claude/`, `~/.claude/`, or any auto-memory path. All memory for this project lives under `docs/memory/` — full stop. If the auto-memory system or any tool tries to route a save there, redirect it to `docs/memory/<side>/` instead.

Rules — these are **strict**, not optional:

- **Always check first.** Before answering or planning, read `docs/memory/MEMORY.md` and any entries relevant to the request. If memory contradicts what you observe in the code, trust the code and update the memory.
- **Save whenever there is something worth remembering** — user preferences, project decisions made in chat, gotchas discovered while debugging, external references, non-obvious conventions. If you are unsure whether it is worth saving, save it.
- **Pick the right side.** Frontend-only facts go in `docs/memory/frontend/`. Contracts/Hardhat-only facts go in `docs/memory/contracts/`. If a fact spans both, save it under the side it most directly constrains and link to the other side from the body.
- **One memory per file**, kebab-case filename, with frontmatter:

  ```markdown
  ---
  name: <kebab-case-slug>
  description: <one-line summary for relevance matching>
  metadata:
    type: user | feedback | project | reference
    scope: frontend | contracts
  ---

  <body — for feedback/project, include **Why:** and **How to apply:** lines>
  ```

- **Update the index.** Every new or renamed memory file must have a matching one-line entry added to `docs/memory/MEMORY.md` under its side's section.
- **No duplicates.** Before writing a new memory, search existing files for the same topic and update in place if one exists.
- **Prune what is wrong.** If a memory turns out to be stale or incorrect, fix or delete it — do not leave conflicting memories.

### 4. Decision log (STRICT)

Every decision made during planning or implementation must be recorded as its own file under `docs/decisions/`.

- One decision = one file. Never append multiple decisions to the same file.
- Filename: `YYYY-MM-DD-NNN-<slug>.md` (date + daily sequence + short slug), so files sort chronologically and ties are deterministic.
- Required frontmatter:

  ```markdown
  ---
  date: YYYY-MM-DD
  scope: frontend | contracts | both
  status: proposed | accepted | superseded
  related_adr: <NNNN-slug or none>
  supersedes: <filename or none>
  ---
  ```

- Body must cover, in this order: **Context**, **Decision**, **Alternatives considered**, **Consequences**.
- ADRs vs decision log: ADRs (`docs/adr/`) capture the *architectural* decision tied to a request. The decision log captures **every** decision — including small ones made mid-implementation (library picks, naming, gas trade-offs, UX micro-choices). When a small decision is large enough to also warrant an ADR, link them via `related_adr`.
- When a later decision overrides an earlier one, set the old file's `status: superseded` and point the new file's `supersedes:` at it. Never silently rewrite history.
- Maintain `docs/decisions/INDEX.md` with one line per decision file, newest first.

### 5. Implementation only on explicit command

Do **not** start implementing after producing the ADR + plans. Wait for the user to review.

The user will trigger implementation with one of two commands:

- **`autonomous`** — work through the plan tasks one after another from start to finish without stopping for review between tasks. Report progress as tasks complete; only stop on blockers or when the plan is done.
- **`implement`** — execute the **next single task** from the plan, then stop and wait for the user to review the code before continuing.

In both modes:
- Follow the plan as written. If a plan step turns out to be wrong, stop and propose an amendment to the plan rather than silently diverging.
- Keep frontend and contract changes in lockstep — if a contracts task changes an ABI, the matching frontend task must follow before the feature is considered complete.
- Mark tasks as done in the plan file as they complete.
