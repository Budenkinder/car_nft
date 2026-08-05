# Manual verification — ADR 0035 frontend (org role gating + registration)

This project has no automated frontend test runner (see `docs/memory/frontend/`).
These are the manual passes for plan `0035-org-role-multisig-admin-frontend.md`
tasks 11, 12, and 15.

Prerequisites: a local Hardhat node running with the ADR 0035 contract
deployed (`npm run deploy:local`), and `frontend/.env.local` pointing at it.
`npm run org-role:local` (from the repo root) grants/revokes `ORG_ROLE` for
any wallet address — used throughout below.

## Task 11 — role gating survives a wallet/account switch

1. `npm run build` compiles with no errors (already confirmed 2026-08-04).
2. Import a Hardhat test account into MetaMask that holds `ORG_ROLE` (the
   `INITIAL_MINTER` account, or one granted via `npm run org-role:local`).
   Connect it. Expect: the "Create or Update CAR NFT" panel shows the form
   (no loading spinner stuck, no not-approved message), and a mint succeeds.
3. Switch MetaMask to an account that does **not** hold `ORG_ROLE`. Expect:
   the panel replaces the form with "This wallet is not registered as an
   approved organization" and an "Apply to become an approved organization"
   button. The role check re-runs automatically on the account switch (no
   page reload needed).
4. Click "Apply to become an approved organization". Expect: the view
   switches to the registration page; "Back" returns to the registry view
   with prior state (VIN search, NFT list) intact.
5. Disconnect the wallet entirely (MetaMask lock, or revoke site
   permission). Expect: the panel shows "Connect your wallet to create or
   update a car record," not the not-approved message (those are different
   states — no wallet vs. a wallet without the role).

## Task 12 — application flow

Since ADR 0037, there are **three** required steps, not two: Organization
Identity, Wallet + signature, and an on-chain receipt. The "Submit" section
(email/copy buttons) only appears once **both** the signature and the
on-chain receipt exist.

1. From the not-approved state, open the registration page.
2. Fill both identity/wallet sections. Leave one required field empty and try
   to sign — expect inline validation errors, no signature prompt.
3. Fill the remaining fields and click "Sign challenge with MetaMask".
   Expect a MetaMask `personal_sign` prompt showing the exact challenge text
   (`I confirm control of this wallet for car_nft registration — <legal
   name> — <ISO timestamp>`).
4. Reject the signature prompt once — expect a visible error, not a crash.
5. Sign for real. Expect a green confirmation and a new "3. On-chain
   Receipt" section to appear with a "Submit on-chain receipt" button — the
   "Submit" (email) section must **not** appear yet.
6. Reject the on-chain-receipt transaction prompt once — expect a visible
   error ("Transaction was rejected...") and the "Submit" section still
   hidden.
7. Click "Submit on-chain receipt" again and confirm the transaction for
   real. Expect a pending state, then a green "On-chain receipt confirmed:
   <tx hash>" line with a working block-explorer link, and the "Submit"
   section (with "Open email to submit" and "Copy application text") to
   appear and auto-scroll into view.
8. Edit any field after both proofs exist — expect **both** the signature
   and the on-chain receipt to clear (re-signing and re-submitting the
   receipt are both required before the submit section reappears).
9. Click "Open email to submit". Expect the OS/browser mail client opens
   with `REACT_APP_ORG_APPLICATION_EMAIL` as recipient, a subject line
   naming the legal name, and a body containing every field plus the
   challenge, signature, transaction hash, and block-explorer link. **Check
   whether the body is truncated** — if so, this is the known `mailto:`
   length limit (decision `2026-08-03-001`); use "Copy application text"
   instead and note the truncation point as a plan amendment.
10. Click "Copy application text" and paste into a text editor — confirm the
    full body is present and matches what would be emailed.
11. Switch MetaMask accounts between either proof and the final submit step —
    expect both the stale signature and the stale receipt to already be
    cleared, so nothing mismatched can be submitted silently.
12. With a wallet holding zero ETH, attempt "Submit on-chain receipt" —
    expect a friendly "doesn't have enough network gas" error, not a raw
    RPC error message or a silent hang.

## Task 15 — org wallets list

1. On the registry view, confirm the "Approved Organizations" panel is
   visible on the side regardless of connected wallet or its `ORG_ROLE`
   status (it is public information, not gated).
2. Note the current list. Run
   `TARGET_WALLET=<address> npm run org-role:local` to grant `ORG_ROLE` to a
   new wallet, then click "Refresh" in the panel. Expect the new address to
   appear.
3. Run the same command with `ROLE_ACTION=revoke`, click "Refresh" again.
   Expect the address to disappear.
4. Temporarily point `REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL` at a bogus
   address (or stop the Hardhat node) and click "Refresh". Expect a visible
   error message, not a silent empty list — an empty list must always mean
   "confirmed zero holders," never "the read failed."
