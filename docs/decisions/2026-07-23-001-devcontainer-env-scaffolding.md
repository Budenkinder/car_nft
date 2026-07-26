---
date: 2026-07-23
scope: both
status: proposed
related_adr: 0013-devcontainer-env-scaffolding
supersedes: none
---

# Scaffold `.env` / `frontend/.env.local` on Dev Container creation instead of leaving them unhandled

## Context

While reviewing env var / key handling after the move to a Dev Container, found that `.devcontainer/devcontainer.json`'s `postCreateCommand` never creates either gitignored env file (`.env`, `frontend/.env.local`) — a fresh container gets silent empty-string config rather than a pointer to the `.example` templates. Also found the *current* workspace's env files hold live-looking secrets in plaintext (a deployer private key, an Infura URL, an Etherscan key, and a Pinata JWT decoding to a real personal email) — confirmed via `git log --all` that none of this was ever committed, but it now lives in a container filesystem rather than only the host. Separately in this session, worked out that the app's only Pinata call is `pinJSONToIPFS` (legacy Pinning Services API), so a replacement JWT only needs that one permission scoped on.

## Decision

Open ADR 0013 and draft paired plans (`docs/plans/draft/0013-devcontainer-env-scaffolding-{frontend,contracts}.md`) to add `.devcontainer/setup.sh`, wired into `postCreateCommand`, that copies each `.example` template to its real filename only when the real file is absent (idempotent, never overwrites, never contains real values) — plus manual (non-code) tasks to rotate the currently-embedded secrets, including generating the new minimally-scoped Pinata JWT already discussed. Implementation is deferred until the user reviews and approves the plan trio, per this repo's workflow rules.

## Alternatives Considered

- **Scaffold script wired into `postCreateCommand`** — chosen. Fixes the silent-failure mode for fresh containers at low cost.
- **Inline the scaffold logic into the `postCreateCommand` JSON string directly** — rejected, unreadable and untestable as a one-line string.
- **Documentation-only fix**, mirroring how ADR 0008 handled the adjacent root-`npm install` gap — rejected here because a missing `.env` fails silently (empty config) rather than loudly (`command not found`), which is a worse failure mode worth the small script.

## Consequences

- **Positive:** fresh Dev Container / Codespace creations get non-empty placeholder env files with an actionable reminder; existing real files are never touched.
- **Negative / accepted costs:** one more script to keep in sync with the `.example` schemas; still requires a manual step (filling in real secrets) — by design, since a script must never generate or contain real secrets.
- **Follow-ups required:** user approval of the plan trio before implementation; manual rotation of the currently-embedded root and frontend secrets; a decision (tracked as an Open Question in the contracts plan) on whether to fold ADR 0008's still-open root-`npm install` gap into the same `postCreateCommand` change.
