# Plan 0037 — Application On-Chain Receipt — Frontend

- **ADR:** `docs/adr/0037-application-onchain-receipt.md`
- **Paired plan:** `docs/plans/done/0037-application-onchain-receipt-contracts.md`
- **GitHub Issue:** [#44](https://github.com/Budenkinder/car_nft/issues/44)
- **Status:** done
- **Date:** 2026-08-05

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a new required step to `OrgRegistrationForm` between the existing `personal_sign` challenge and the email/submit section: after signing, the applicant sends a real, minimal transaction (`submitApplication()`) from their connected wallet, and only once it is mined and confirmed successful does the form unlock the email step, now including the transaction hash and a block-explorer link in the application email. Out of scope: any change to the fields already collected (decisions `2026-08-05-001`, `-002`), any change to `OrgWalletsList`, and any change to the existing role-check gating in `App.js`.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/utils/pinata_ipfs_nft_service.js` | modify | Add `submitApplicationReceipt(walletAddress, chainId)` following the existing `storeCidOnBlockchain` send-and-await-receipt pattern |
| `frontend/src/utils/org_application.js` | modify | `buildApplicationEmailBody` gains a third section (tx hash + explorer link); add `buildExplorerTxLink(chainId, txHash)` |
| `frontend/src/components/OrgRegistrationForm.jsx` | modify | New state (`txHash`, `isSubmittingTx`), new step UI, gate email/submit section on both `signature` and `txHash`, reset `txHash` alongside `signature` on any field/wallet change |
| `frontend/src/components/OrgRegistrationForm.test-notes.md` | modify | Reflect the new required on-chain-receipt step |
| `frontend/src/App.js` | modify | Pass the existing `chainId` state down to `OrgRegistrationForm` (needed to resolve the contract address for `submitApplicationReceipt`) — same pattern already used for `OrgWalletsList` |

## Tasks

- [x] **1.** Add `submitApplicationReceipt(walletAddress, chainId)` to `pinata_ipfs_nft_service.js`: instantiate `web3`/`contract` the same way `storeCidOnBlockchain` does, call `contract.methods.submitApplication().send({ from: walletAddress, gas })` (estimate gas the same way, `Math.ceil(estimate * 1.2)`), and return `{ txHash: receipt.transactionHash, blockNumber: receipt.blockNumber }` — let `.send()`'s built-in revert-on-failed-receipt behavior propagate as a thrown error (matches the existing `storeCidOnBlockchain` pattern; no need to re-check `receipt.status` separately since web3.js already rejects a reverted send).
- [x] **2.** Add `buildExplorerTxLink(txHash)` to `org_application.js`. **Deviation from plan:** dropped the `chainId` parameter — the existing App.js convention this matches (`App.js:531,555`) is itself hardcoded to Sepolia regardless of chain, so threading a `chainId` through here would imply a network-awareness the reused pattern doesn't actually have. Returns `https://sepolia.etherscan.io/tx/${txHash}`, same as before.
- [x] **3.** Extend `buildApplicationEmailBody(fields, challenge, signature, txHash)` (no `chainId` param, per task 2's note) with a third section:
  ```
  == 3. On-chain Receipt ==
  Transaction hash: ${txHash}
  View on block explorer: ${buildExplorerTxLink(txHash)}
  ```
- [x] **4.** In `OrgRegistrationForm.jsx`: added `txHash` and `isSubmittingTx` state, plus a separate `handleSubmitReceipt` triggered by its own button (shown once `signature` is set) — chosen over auto-firing after sign so the applicant isn't surprised by a second wallet prompt stacked on the free one, and understands this step costs gas. Pending state ("Submitting...") and error paths for rejection (`code === 4001`), insufficient funds (regex-matched, friendly message), and any other failure are all handled.
- [x] **5.** Gated the Submit block on `{signature && txHash && (...)}`.
- [x] **6.** `setField` and the `walletAddress`-change `useEffect` both now also clear `txHash`.
- [x] **7.** Auto-scroll effect now keyed on `txHash` instead of `signature`.
- [x] **8.** `OrgRegistrationForm.test-notes.md` task 12 rewritten for the 3-step flow (rejection path, insufficient-funds path, field-edit/account-switch clearing both proofs).
- [x] **9.** Rebuilt (`CI=true npm run build`, compiled clean) and re-verified live via the headless-Chromium harness (new script `drive7-onchain-receipt.js`, mocked EIP-1193 provider proxying a real local Hardhat node upgraded via `npm run upgrade:local`). Confirmed: Submit section absent after signing alone; "3. On-chain Receipt" step appears; a simulated rejected transaction shows the friendly rejection error and keeps Submit hidden; submitting for real produces a genuine mined tx hash with a working-looking explorer link; the Submit section then appears and auto-scrolls into view; the email body contains the on-chain-receipt section with the real tx hash and link; editing a field afterward clears both signature and receipt and re-hides Submit; switching accounts also clears both. All assertions passed; only the pre-existing benign React-18 `ReactDOM.render` deprecation warning appeared in console errors.

## Interfaces with Contracts

- **Function called:** `submitApplication()` — no arguments, no return value; success/failure read from the transaction receipt.
- **Events consumed:** none directly (the frontend already has everything it needs from the `.send()` receipt).
- **ABI / address handoff:** reuses the existing `contract_abi.json` + `getContractAddress(chainId)` path — no new handoff mechanism. Once the contracts plan's implementation lands (whether bundled into ADR 0035's still-pending upgrade or as its own small follow-up upgrade), the frontend's copy of `contract_abi.json` must be refreshed the same way prior ABI changes in this project were (via the deploy/upgrade script's frontend-sync step).
- **Network assumptions:** works against localhost (31337) for development/verification and Sepolia (11155111) for production, same as every other contract call in this app; the block-explorer link is only correct on Sepolia (matches the existing, pre-existing limitation of `App.js`'s own explorer links — not a new gap introduced by this plan).

## Testing

- Manual verification via the headless-Chromium + mocked-provider harness established earlier this session (real local Hardhat node backing a fake EIP-1193 provider, since MetaMask itself can't be installed in this sandbox) — see Task 9.
- Specifically exercise: successful path (sign → submit receipt → email contains tx hash/link); rejection path (user declines the transaction in the wallet); a field edit after both proofs exist (confirms both clear, not just the signature); the account-switch scenario already covered for the signature (confirms it also clears `txHash`).
- No unit test framework is currently wired up for this component (per this session's established approach — manual/headless-browser verification has been the pattern throughout ADR 0035's implementation); follow that same pattern here rather than introducing one now.

## Risks and Rollback

- **Risk:** applicants with a zero-ETH wallet cannot complete an application at all — this is a new hard blocker that didn't exist before (signing was free). Accepted per ADR 0037; flagged as a known v1 cost, not solved by this plan.
- **Risk:** on a slow or congested network, the applicant waits for a real confirmation (unlike the instant `personal_sign` step) — surfaced via a clear pending/loading state so it doesn't look hung.
- **Rollback:** purely additive UI gating — if this needs to be reverted, the Submit section's gate can revert to `{signature && (...)}` and the new step's UI removed, with no effect on the already-shipped signature flow.

## Open Questions

- None — the user has already confirmed the on-chain-transaction approach via `AskUserQuestion`; the rest is mechanical.
