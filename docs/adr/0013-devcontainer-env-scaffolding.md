# ADR 0013: Scaffold `.env` files on Dev Container creation

- **Status:** proposed
- **Date:** 2026-07-23
- **Scope:** both
- **Related plans:**
  - `docs/plans/approved/0013-devcontainer-env-scaffolding-frontend.md`
  - `docs/plans/approved/0013-devcontainer-env-scaffolding-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-23-001-devcontainer-env-scaffolding.md`, `docs/decisions/2026-07-23-002-plan-0013-draft-to-approved.md`

## Context

The repo depends on two gitignored env files: root `.env` (Hardhat — `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `ETHERSCAN_API_KEY`, `INITIAL_MINTER`, `REWARD_AMOUNT`, `REWARD_FUND`) and `frontend/.env.local` (CRA — `REACT_APP_PINATA_API_URL`, `REACT_APP_PINATA_JWT`, `REACT_APP_SMART_CONTRACT_ADDRESS[_LOCAL]`).

`.devcontainer/devcontainer.json`'s `postCreateCommand` is `cd frontend && npm install` — it never touches either env file. ADR 0008 already flagged that `postCreateCommand` only installs `frontend/` dependencies (root `npm install` for Hardhat is a documented manual step) and explicitly deferred fixing `postCreateCommand` itself: "changing `postCreateCommand` is a separate, reversible-but-distinct decision that deserves its own ask/ADR if wanted." This ADR is that follow-up, scoped to the env-file gap specifically (not the root `npm install` gap — see the contracts plan's Open Questions for whether to bundle them).

On the current, already-provisioned workspace both files exist (created before the Dev Container existed) and hold live-looking secrets in plaintext: a `DEPLOYER_PRIVATE_KEY`, a project-scoped `SEPOLIA_RPC_URL`, an `ETHERSCAN_API_KEY`, and a Pinata JWT (`frontend/.env.local`) that decodes to a real personal email address. Verified via `git ls-files` / `git log --all -- .env .env.local frontend/.env.local` that neither file has ever been committed — the `.gitignore` rule is working as intended. But the files now sit in plaintext inside a container filesystem, not only on one developer's host, which is a larger blast radius than before.

Separately: on a genuinely fresh checkout (new Codespace, fresh clone, container rebuilt from scratch) neither `.env` nor `frontend/.env.local` exists, and nothing creates them. Hardhat and CRA both then run with the corresponding vars silently undefined — `hardhat.config.js` just omits the `sepolia` network (no error), and the frontend renders "no contract configured" banners — instead of pointing the new contributor at `.env.example` / `frontend/.env.example`.

## Decision

Add `.devcontainer/setup.sh`, invoked from `postCreateCommand`, that idempotently scaffolds both env files from their `.example` templates when missing (copy-if-absent only — never overwrites an existing file, never fills in a real value), then runs the existing `frontend && npm install`. Separately, as a manual (non-code) follow-up tracked in both plans: rotate the currently-embedded live secrets, since they're already exposed to the container filesystem rather than just the host. Rotation requires provider-side action (Infura/Etherscan/Pinata dashboards) that only the user can take — it is not something a script can safely automate, and a script must never contain or generate real secrets.

## Options Considered

### Option A — `.devcontainer/setup.sh` scaffold script wired into `postCreateCommand` *(chosen)*
- **Pros:** fresh Codespaces/rebuilds get working placeholder files automatically with an actionable reminder; a real, non-empty repo file to comment and extend later; idempotent (never clobbers real secrets already in place).
- **Cons:** one more file to keep in sync if `.env.example` / `frontend/.env.example`'s schema changes.

### Option B — Inline the scaffold logic directly into the `postCreateCommand` string in `devcontainer.json`
- **Pros:** no new file.
- **Cons:** unreadable as a one-line shell string, no room for comments, harder to test locally (a `.sh` file can be run standalone; a JSON string can't).

### Option C — Documentation-only, mirroring how ADR 0008 handled the root-`npm install` gap
- **Pros:** zero code risk.
- **Cons:** a missing `node_modules` fails loudly (`command not found`); a missing `.env` fails silently with empty-string config, which is a worse failure mode for a new contributor to debug blind. The fix is ~10 lines of shell — cheaper than the debugging time it saves.

## Consequences

- **Positive:** fresh Dev Container / Codespace creations get non-empty placeholder env files automatically, with a printed reminder of exactly which keys to fill in; existing real `.env` files are never touched.
- **Negative:** does not auto-fill real secrets (by design); one more script to maintain if the `.example` schemas drift.
- **Frontend impact:** `frontend/.env.local` gets scaffolded from `frontend/.env.example` when absent; no `frontend/src` code changes.
- **Contracts impact:** root `.env` gets scaffolded from `.env.example` when absent; `.devcontainer/devcontainer.json`'s `postCreateCommand` changes to invoke the new script.
- **Follow-ups:** user manually rotates the currently-embedded Pinata JWT (this session already scoped the replacement key: legacy Pinning Services API, `pinJSONToIPFS` permission only, tied to an alias email) and, at their discretion, the testnet `DEPLOYER_PRIVATE_KEY` / `SEPOLIA_RPC_URL` / `ETHERSCAN_API_KEY`. Whether to also fold ADR 0008's still-open root-`npm install` gap into the same script is left as an open question in the contracts plan.

## References

- ADR 0008 — `docs/adr/0008-readme-hardhat3-devcontainer-docs.md` (documented, but explicitly deferred, this exact `postCreateCommand` fix).
- `.devcontainer/devcontainer.json`, `.env.example`, `frontend/.env.example` — the files this ADR scaffolds between.
- [#41](https://github.com/Budenkinder/car_nft/issues/41) — tracking issue, backfilled 2026-08-02 under ADR 0034's rule that every approved trio carries one.
- This session's discussion: minimal Pinata JWT scope is the legacy Pinning Services API's `pinJSONToIPFS` permission only (confirmed against `frontend/src/utils/pinata_ipfs_nft_service.js`, which only calls that one endpoint plus unauthenticated public-gateway reads).
