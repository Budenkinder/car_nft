# ADR 0024: Document that MetaMask needs the CRT token manually imported to be visible

- **Status:** accepted
- **Date:** 2026-07-28
- **Scope:** both
- **Related plans:**
  - `docs/plans/in-progress/0024-readme-crt-metamask-import-frontend.md`
  - `docs/plans/in-progress/0024-readme-crt-metamask-import-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-28-010-readme-crt-metamask-import.md`

## Context

The user ran a real Sepolia mint and reported not seeing CRT tokens in MetaMask for the minter account. Investigation (this session, prior turns) pulled the transaction receipt directly from Sepolia and confirmed the CRT `Transfer` event fired correctly: 10 CRT moved from the registry to the **recipient** wallet (`_payReward` always pays `recipient`, never `msg.sender` — see [car_nft_sc.sol:130](../../contracts/car_nft_sc.sol#L130)). So there were two separate sources of "not seeing it": (1) checking the wrong account (minter instead of recipient), and (2) even on the right account, MetaMask does not auto-detect arbitrary ERC-20 balances — the CRT token must be manually added via *Import tokens* using its contract address, exactly the same class of limitation the README already documents for NFTs (ADR 0016, "ETH balance vs. NFT tokens").

While locating the current CarRewardToken address to cite in the fix, the README's existing "Reference deployment (Sepolia)" section (lines 228-229) was found to hardcode **stale** addresses (`0x66060BA7...` for CarRewardToken, `0x13F88B69...` for VinCidRegistry) that no longer match `deployments/sepolia.json` (the file that same section calls "always" the source of truth) or today's live deploy (`0xABdC5742...` / `0x089711b3...`, confirmed on-chain via the tx receipt and recorded in `docs/deployments/sepolia_contract_deploy_addresses_2026-07-28.md`). Since this ADR's whole purpose is to give readers a trustworthy CRT contract address, shipping a doc change that points at a stale address in the same section would be self-defeating, so refreshing those two addresses is folded into this change.

## Decision

Add a new README note, parallel in style to the existing "ETH balance vs. NFT tokens" callout, explaining that MetaMask's automatic token detection does not cover the CRT ERC-20 either, and that seeing a CRT balance requires manually adding the token in MetaMask (Assets tab → *Import tokens* → paste the CarRewardToken contract address). Add a matching Troubleshooting bullet distinct from the existing "Reward not received" one (that one covers the registry being underfunded; the new one covers "the reward was paid but MetaMask doesn't show it"). Also correct the two stale hardcoded Sepolia addresses in "Reference deployment (Sepolia)" to match current `deployments/sepolia.json`.

## Options Considered

### Option A — Add a CRT-specific MetaMask-import note + fix stale reference addresses in the same change (chosen)
- **Pros:** Keeps the CRT address the reader is told to use accurate; consistent with the existing NFT-visibility note's style and placement; addresses the actual root cause the user hit (reward paid to recipient, not visible without import) rather than just restating "check your balance."
- **Cons:** Slightly broadens the diff beyond the literal request (two stale addresses updated too) — judged in-scope since they're in the exact section being edited for the exact topic (CRT contract address).

### Option B — Add the note only, leave stale reference addresses as-is
- **Pros:** Smaller, more literal diff.
- **Cons:** Ships a documentation change instructing readers to trust "the reference deployment" for the CRT address while a stale, wrong address sits two sections away — actively misleading for anyone who reads further.

### Option C — Also clarify that the reward goes to `recipient`, not the connected/minter wallet
- **Pros:** Addresses the other half of the user's confusion (checking the wrong account) directly in the README, not just verbally.
- **Cons:** README line 268 already states "The NFT lands in the recipient's wallet; the CRT reward is also paid to the recipient" — this is already covered; no gap to close here, so no action needed beyond what's already written.

## Consequences

- **Positive:** Readers who complete a mint and don't see CRT in MetaMask now have a documented, correct explanation and fix path, with an accurate contract address to use.
- **Negative:** None material — documentation only.
- **Frontend impact:** None to application code; `README.md` only.
- **Contracts impact:** None to contract code; confirms (does not change) that the CRT address cited matches `deployments/sepolia.json` / `contracts/car_reward_token.sol`.
- **Follow-ups:** None planned. (Noted but explicitly out of scope: `README.md:268` still shows the pre-ADR-0023 field label `"Car Owner Wallet (recipient)"` rather than the current `"TÜV Car Inspection Wallet Address (recipient)"` — unrelated topic to this ADR, flagged separately rather than folded in here.)

## References

- ADR 0016 (`docs/adr/0016-readme-hardhat-nft-visibility.md`) — the precedent this note's style and placement follow.
- ADR 0023 (`docs/adr/0023-recipient-field-label-tuv.md`) — prior change in this session; surfaced the now-stale label at `README.md:268`, noted above as an explicit non-goal here.
- Sepolia tx receipt `0x2bd565bd92c649bbb9016f5b24ff73483f1b9a205a54d14feb6ad5f08b4565cf`, confirming the CRT `Transfer` to the recipient wallet.
