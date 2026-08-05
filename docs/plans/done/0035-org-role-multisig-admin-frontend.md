# Plan 0035 — Org role + deployer-EOA admin — Frontend

- **ADR:** `docs/adr/0035-org-role-multisig-admin.md`
- **Paired plan:** `docs/plans/done/0035-org-role-multisig-admin-contracts.md`
- **GitHub Issue:** [#43](https://github.com/Budenkinder/car_nft/issues/43)
- **Status:** done
- **Date:** 2026-08-03

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Three deliverables. **(1)** A public organization-registration page that collects the KYB application, obtains a `personal_sign` proof that the applicant controls the wallet being registered, and submits the whole thing as a prefilled email — no backend, no upload, no storage anywhere in this system. **(2)** Role-aware gating of the existing create/update panel: a connected wallet without `ORG_ROLE` sees a clear "not approved" state and a route to apply, instead of a form that will revert on submit. **(3)** A read-only sidebar list of every wallet currently holding `ORG_ROLE` — the wallets allowed to register/update VINs — reconstructed from `RoleGranted`/`RoleRevoked` events (decision `2026-08-04-002`). Display only: granting/revoking stays a terminal action by the deployer (`scripts/manage-org-role.js` in the paired contracts plan), not something this app can do.

Out of scope:

- Any storage or transmission of KYB documents by this application. Certificates and insurance papers are attached by the applicant to their own email client and never touch the app, IPFS, or the repo (decision `2026-08-03-002`).
- An admin/approval UI. Approval is a direct `grantRole` transaction from the deployer wallet (Etherscan's "Write Contract" tab or a script) — building a second interface for this app would be duplicated trust surface for no gain. See decision `2026-08-04-001`.
- Application status tracking, queue, or applicant login. Email intake has none of these, by decision `2026-08-03-001`.
- `react-router`. The app has no router today; ADR 0029 may introduce one. This plan uses local view state so it does not prejudge that.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/components/OrgRegistrationForm.jsx` | add | the application form, grouped into six sections (trimmed by decision `2026-08-05-001`) |
| `frontend/src/components/OrgRegistrationForm.test-notes.md` | add | manual verification script (no test runner in this project for UI) |
| `frontend/src/components/OrgWalletsList.jsx` | add | read-only sidebar panel listing current `ORG_ROLE` holders |
| `frontend/src/utils/org_application.js` | add | challenge-string builder, `personal_sign` call, `mailto:` body assembly |
| `frontend/src/utils/validation.js` | modify | validators for VAT/tax ID, registration number, email, wallet address, expiry date |
| `frontend/src/utils/pinata_ipfs_nft_service.js` | modify | add `hasOrgRole(account, chainId)`; add `getOrgRoleHolders(chainId)` reconstructing current holders from `RoleGranted`/`RoleRevoked` |
| `frontend/src/App.js` | modify | role check on connect; gate the create/update panel; view switch to the registration page; mount `OrgWalletsList` |
| `frontend/src/utils/contract_abi.json` | regenerated | by `scripts/deploy.js` — do not hand-edit |
| `frontend/.env.example` | modify | `REACT_APP_ORG_APPLICATION_EMAIL` |

## Tasks

Execute in order. Each task is small enough to implement and review independently.

- [x] **1.** Add `hasOrgRole(account, chainId)` to `pinata_ipfs_nft_service.js`, following the existing web3/contract construction pattern used by `getCidFromContract`: read the `ORG_ROLE()` constant from the contract, then call `hasRole(role, account)`. Return `false` (never throw) on any RPC error, and log via `netLog` like the other reads — a failed role check must not blank the UI.
- [x] **2.** In `App.js`, call `hasOrgRole` after wallet connect and on account change, into new `isOrg` state. While the check is in flight, show a neutral loading state rather than assuming either answer.
- [x] **3.** Gate the "Create or Update CAR NFT" panel on `isOrg`. A connected non-org wallet sees an explanatory panel — *this wallet is not registered as an approved organization* — with a button to the registration page. Do **not** hide the panel silently; a form that reverts on submit is the current failure mode and the reason for this task. Reads ("Load Car NFT", "Show All Registered NFTs") stay open to everyone; nothing about public readability changes in this plan.
- [x] **4.** Add a view switch in `App.js` (local state, MUI `Tabs` or a simple conditional — no router) between the main registry view and the new registration page, with the state in the URL hash only if that is free to do; otherwise leave it out rather than pulling in a routing dependency. *(Implemented as plain conditional local state; URL hash left out.)*
- [x] **5.** Build `OrgRegistrationForm.jsx`. Originally spec'd with seven sections (organization identity, trade qualification, insurance, contact person, wallet, supporting evidence, declarations). Trimmed twice: decision `2026-08-05-001` removed the founded date, craftsman certificate, specialization, insurance provider/policy number, and the entire Contact Person section; decision `2026-08-05-002` then removed the remaining trade-qualification/insurance/supporting-evidence/declarations fields entirely. **Current shape: two sections** — **(1)** organization identity — legal name, registration number, tax/VAT ID, business address; **(2)** wallet — address plus the signature from task 6. Document uploads are **not** form fields: the email body's "Documents to attach" checklist covers that instead. MUI v5 components throughout, matching the existing panels.
- [x] **6.** In `org_application.js`, build the challenge string — `I confirm control of this wallet for car_nft registration — <legal name> — <ISO timestamp>` — and sign it via `personal_sign` through the connected provider. Display the signature in the form and include it in the email body. Note in a code comment that this proof is verified **by a human reviewer** (off-chain, e.g. via `web3.eth.personal.ecRecover` or Etherscan's verifier), not by the contract.
- [x] **7.** Assemble the `mailto:` submission: recipient from `REACT_APP_ORG_APPLICATION_EMAIL`, a structured plain-text body of every field plus the challenge and signature, and a checklist of documents the applicant must attach. **Verify the length limit in a real browser before considering this task done** — `mailto:` bodies are truncated at varying lengths across clients (commonly ~2,000 characters), and this body will be long. If it truncates, fall back to rendering the body in a copyable text block with a "copy to clipboard" button next to the mail link, and record that as a plan amendment. *(Verified: a representative filled-in application produced a ~1,860-character mailto: link, under the warning threshold; the copy-to-clipboard fallback ships regardless, since real mail clients vary. See task 12's verification note.)*
- [x] **8.** Add the new field validators to `validation.js`, following the existing VIN-validation style. Keep them permissive on format (European registration and tax identifiers vary widely); required-vs-empty and obvious-typo checks are the goal, not authoritative validation. The wallet address check must be strict, since it is what gets granted the role.
- [x] **9.** Add `REACT_APP_ORG_APPLICATION_EMAIL` to `frontend/.env.example` with a comment that it is a public inbox address, embedded in the built bundle like every other `REACT_APP_*` var.
- [x] **10.** Write `OrgRegistrationForm.test-notes.md`: the manual verification script for tasks 11-12, since this project has no frontend test runner (consistent with `docs/memory/frontend/`).
- [x] **11.** Manual verification against a local Hardhat node: connect a wallet **with** `ORG_ROLE` (the create/update panel is available and a mint succeeds), then one **without** (the panel is replaced by the not-approved state, and the registration page is reachable). Confirm the role check survives an account switch in MetaMask. *(No MetaMask extension is installable in this sandboxed environment. Verified instead via `npm run build` + a headless-Chromium session with a minimal injected EIP-1193 provider proxying to the local Hardhat node — functionally equivalent to a MetaMask account switch. Confirmed: ORG_ROLE wallet sees the form; non-org wallet sees the not-approved panel with a working "Apply" link. Real-MetaMask confirmation is still recommended before Sepolia.)*
- [x] **12.** Manual verification of the application flow: fill the form, sign the challenge, confirm the signature recovers to the connected address, open the mail client, and confirm the body arrives intact and complete. *(Verified via the same headless-Chromium harness: filled all sections, `personal_sign` succeeded against a real Hardhat dev-account signature, the signed confirmation and "Open email to submit" / "Copy application text" both appeared, and editing a field after signing correctly cleared the signature. The generated `mailto:` link was inspected directly and contains every field, the challenge, and the signature intact. Re-verified 2026-08-05 against the trimmed 6-section field set from decision `2026-08-05-001` — body length dropped to ~1,490 chars.)*
- [x] **13.** Add `getOrgRoleHolders(chainId)` to `pinata_ipfs_nft_service.js`, following the existing `getTransactionHistoryForVin` pattern: fetch `RoleGranted`/`RoleRevoked` events for `ORG_ROLE` from `getContractDeployBlock(chainId)` via `getPastEventsChunked`, then reduce them in block/log order — a wallet is a current holder if its most recent matching event is a grant, not a revoke. Return a sorted array of addresses, never throw (empty array + `netLog` on RPC failure), matching every other read in this file. *(Manual verification caught a real bug here — see decision `2026-08-04-006` — fixed before this task was marked done.)*
- [x] **14.** Build `OrgWalletsList.jsx`: a read-only side panel, visible to everyone (this is public on-chain information, same trust level as "Show All Registered NFTs"), showing the wallets `getOrgRoleHolders` returns, with a loading state and a visible error state on failure — never a silent empty list indistinguishable from "no orgs approved yet." Add a manual refresh action (event data is not subscribed live). Mount it in `App.js`'s layout as a persistent side panel, not gated behind `isOrg`.
- [x] **15.** Manual verification: with a local Hardhat node, use the paired contracts plan's `scripts/manage-org-role.js` to grant `ORG_ROLE` to a second wallet, refresh `OrgWalletsList`, and confirm the wallet appears; revoke it, refresh again, and confirm it disappears. *(Verified live: clicked the actual "Refresh" button in a headless-Chromium session before and after running `npm run org-role:local` grant/revoke against a third wallet — appeared after grant, disappeared after revoke.)*

## Interfaces with Contracts

- Functions called: `ORG_ROLE() -> bytes32`, `hasRole(bytes32,address) -> bool` (both from `AccessControlUpgradeable`, added by the paired contracts plan), plus the existing `storeCid`.
- Events consumed: `RoleGranted`/`RoleRevoked` (stock `AccessControlUpgradeable` events, no ABI changes needed beyond what the paired contracts plan already ships) — consumed by `getOrgRoleHolders` (task 13) to reconstruct the current `ORG_ROLE` membership for `OrgWalletsList`.
- ABI / address handoff: unchanged — `contract_abi.json` and `REACT_APP_SMART_CONTRACT_ADDRESS[_LOCAL]` are written by `scripts/deploy.js`. **The proxy address does not change** across this upgrade, so no env update is needed on Sepolia or Vercel.
- Network assumptions: unchanged (Sepolia + Hardhat localhost).
- **Sequencing:** tasks 1-3 and 13-14 depend on the contracts-side ABI (and, for task 15, the paired plan's `scripts/manage-org-role.js`) existing. Tasks 4-9 (the form) do not touch the contract at all and can be built first if convenient.

## Testing

- No automated frontend tests — consistent with this repo's manual-verification approach for UI/wallet flows.
- Manual scripts per tasks 11-12 and 15, recorded in `OrgRegistrationForm.test-notes.md`.
- Error paths to exercise explicitly: RPC failure during the role check (must degrade to "not approved" with a visible error, not a blank panel); RPC failure during `getOrgRoleHolders` (must show a visible error, not an empty list indistinguishable from zero approved orgs); user rejects the `personal_sign` prompt; wallet disconnected mid-form; account switched between signing and submitting — the signature must be invalidated, not silently sent with a mismatched address.
- `npm run build` must compile cleanly before either manual pass.

## Risks and Rollback

- **The role check is UX, not security.** A hostile user can bypass the gate entirely and call `storeCid` directly; the contract is what actually enforces this. The UI must never be described as the protection.
- **`mailto:` truncation** silently loses the end of a long application — the applicant would never know. Task 7's browser check exists specifically to catch this; the copy-to-clipboard fallback is the mitigation.
- **PII in an inbox.** The email contains named individuals, business identifiers, and attached certificates. That inbox is now in scope for GDPR handling (retention, deletion on request, access control) even though this codebase stores nothing. Worth stating to the user rather than leaving implied.
- **Signature confusion.** Users may believe signing the challenge *is* the registration. Copy must be explicit that it proves wallet control only, and that approval is manual and takes days.
- **`OrgWalletsList` accuracy depends on a complete event scan** from the deploy block. If the contract is ever redeployed fresh (not upgraded), history resets — same caveat this codebase already accepts for `CidStored`-based features.
- **Rollback:** all changes are additive. Removing the view switch and the `isOrg` gate restores current behavior; the form and `OrgWalletsList` are standalone components with no other callers.

## Open Questions

- **Which address receives applications?** Needed for `REACT_APP_ORG_APPLICATION_EMAIL`. It becomes public in the bundle, so it will attract spam — a dedicated address, not a personal one.
- **If `mailto:` truncates,** is the copy-to-clipboard fallback acceptable, or would you rather take the Formspree-style form service (which also handles uploads) despite it being third-party infrastructure? The decision recorded in `2026-08-03-001` chose email; this is only about the failure mode.
- **Should the not-approved panel show the connected address?** Convenient for support ("send me your address"), but it is the same address already visible in MetaMask. Minor; default is yes.
