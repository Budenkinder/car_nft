# Plan 0029 — Ownership history, proof-of-ownership, public lookup — Frontend

- **ADR:** `docs/adr/0029-ownership-history-public-lookup.md`
- **Paired plan:** `docs/plans/draft/0029-ownership-history-public-lookup-contracts.md`
- **GitHub Issue:** [#35](https://github.com/Budenkinder/car_nft/issues/35)
- **Status:** draft
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a wallet-free public lookup page reachable by VIN, an ownership-history read reconstructed from `Transfer` events, and a "Share proof of ownership" affordance in the existing wallet-connected UI. Introduces routing (`react-router-dom`) to this project for the first time. Out of scope: service log / documents / damage flags (a later ADR), and any marketplace UI.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/package.json` | modify | Add `react-router-dom` (routing) and a client-side QR-rendering library (e.g. `qrcode.react`) as dependencies. |
| `frontend/.env.example` | modify | Add `REACT_APP_PUBLIC_RPC_URL` with a comment: must be a frontend-safe (public or origin-restricted) endpoint — never the private deploy `SEPOLIA_RPC_URL`. |
| `frontend/src/index.js` | modify | Wrap `<App />` in `<BrowserRouter>`. |
| `frontend/src/App.js` | modify | Replace the top-level export with a `<Routes>` block: `/` renders the existing wallet-connected UI (unchanged logic, extracted into its own component if needed for routing), `/lookup` and `/lookup/:vin` render the new public page. |
| `frontend/src/pages/PublicLookupPage.js` | add | Wallet-free page: VIN input (if no `:vin` param), fetches current owner, ownership history, CID/metadata, and update history via the read-only RPC client. Renders a human-readable record — make/model/year/mileage/issue/shop from the metadata JSON, not raw ABI output. |
| `frontend/src/components/ShareProofOfOwnership.js` | add | Button shown next to a loaded VIN in the main app: copies `${window.location.origin}/lookup/<vin>` to clipboard and renders it as a QR code via the new dependency. |
| `frontend/src/utils/public_rpc_client.js` | add | Builds a read-only web3/ethers HTTP provider from `REACT_APP_PUBLIC_RPC_URL`, independent of `window.ethereum`. Used only by `PublicLookupPage`. |
| `frontend/src/utils/pinata_ipfs_nft_service.js` | modify | Add `getOwnershipHistoryForVin(vin, chainId, provider)`: computes `tokenId = keccak256(vin)` the same way the contract does, queries `Transfer` events filtered by indexed `tokenId` (RPC-side, not client-side scan), returns `[{ from, to, txHash, blockNumber }]` sorted oldest→newest. Accepts an optional `provider` param so it works with both the injected wallet provider (main app) and the new read-only provider (public page). |

## Tasks

- [ ] **1.** Add `react-router-dom` and a QR-rendering library to `frontend/package.json`; install.
- [ ] **2.** Add `REACT_APP_PUBLIC_RPC_URL` to `frontend/.env.example` with a comment explaining the frontend-safety requirement (must not be the private Hardhat deploy RPC URL/key).
- [ ] **3.** Add `frontend/src/utils/public_rpc_client.js` — a thin wrapper producing a read-only provider from `REACT_APP_PUBLIC_RPC_URL`, matching the existing `contract_utils.js` pattern for resolving the contract address/ABI per chain.
- [ ] **4.** Add `getOwnershipHistoryForVin` to `pinata_ipfs_nft_service.js`, reusing `getPastEventsChunked`'s block-range-splitting helper already used by `getTransactionHistoryForVin`.
- [ ] **5.** Wrap `index.js`'s render in `<BrowserRouter>`; split `App.js`'s existing body into a `MainApp` component and add a `<Routes>` block routing `/` to it.
- [ ] **6.** Add `frontend/src/pages/PublicLookupPage.js`: VIN input (when no route param), loading/error/not-found states, and a read-only rendering of owner + ownership history + current metadata + update history — no wallet-connect prompt anywhere on this route.
- [ ] **7.** Add `frontend/src/components/ShareProofOfOwnership.js` and wire it into the existing "Load Car NFT" result view next to the transaction-history list from ADR 0027.

## Interfaces with Contracts

- Functions called: `ownerOf(tokenId)`, `getCidByVin(vin)` — both existing, unchanged.
- Events consumed: `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)` — standard ERC-721 event already emitted by every mint/transfer; no contract change needed to start consuming it.
- ABI / address handoff: unchanged — same `contract_abi.json` and address resolution as every other read; the public page additionally needs `getContractDeployBlock` (already exists, from ADR 0027) to bound its event query.
- Network assumptions: the public page must work on whichever chain the deployed registry is on (Sepolia in production) without any wallet network-switch prompt, since there's no wallet.

## Testing

- No new unit tests planned (no test runner currently exercises `pinata_ipfs_nft_service.js`'s existing functions either — manual verification matches project convention).
- Manual verification: load `/lookup/<a registered VIN>` in a private/incognito window with no wallet extension enabled; confirm owner, ownership history, and metadata all render. Confirm `/lookup` with no VIN prompts for one. Confirm the "Share proof of ownership" QR code, scanned with a phone camera, opens the same page.
- Verify the public RPC endpoint is rate-limit-tolerant enough for expected traffic before treating this as done (manual, provider-dashboard check).

## Risks and Rollback

- Risk: if `REACT_APP_PUBLIC_RPC_URL` is left unset or misconfigured in Vercel, `/lookup` breaks for all visitors — mitigate with a clear in-page error state distinguishing "no RPC configured" from "VIN not found."
- Risk: a leaked or over-permissioned RPC key embedded in the frontend bundle could be abused for unrelated RPC traffic — mitigate by using a provider that supports origin-restricting the key to the deployed frontend's domain, or a genuinely public/unauthenticated endpoint.
- Rollback: the new route and components are additive; removing the `<Routes>` block and reverting `index.js` fully restores today's single-page behavior with no data migration.

## Open Questions

- Should the public page also expose a "report this listing as inaccurate" contact path, or is chain-verifiable data considered sufficient on its own? Not committed — flagged for later, not blocking this plan.
