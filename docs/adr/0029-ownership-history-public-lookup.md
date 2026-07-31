# ADR 0029: Ownership history, verifiable proof-of-ownership, and a no-wallet public VIN lookup page

- **Status:** proposed
- **Date:** 2026-07-31
- **Scope:** both
- **Related plans:**
  - `docs/plans/draft/0029-ownership-history-public-lookup-frontend.md`
  - `docs/plans/draft/0029-ownership-history-public-lookup-contracts.md`
- **Related decisions:** `docs/decisions/2026-07-31-004-ownership-history-public-lookup-chosen.md`

## Context

The user's product wishlist asked for three related things: (1) full ownership history per car, (2) a verifiable proof-of-ownership a holder can show a buyer/insurer/dealer, and (3) a public lookup page where anyone can type a VIN and see the on-chain record without a wallet. These three are really one feature from three angles — the "proof-of-ownership" a holder shares *is* a link into the public lookup page, and that page's core content *is* the ownership history plus the existing CID/repair-history data.

Today `VinCidRegistry` is a plain `ERC721URIStorageUpgradeable`. `ownerOf(tokenId)` already returns the current owner and every mint/transfer already emits the standard `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)` event — no contract change is needed to reconstruct ownership history, unlike ADR 0027's `CidStored`, `Transfer`'s `tokenId` **is** indexed, so history can be fetched with a cheap RPC-side topic filter instead of `CidStored`'s client-side scan-and-filter.

The harder problem is the "no wallet" requirement. Every existing read in `frontend/src/utils/pinata_ipfs_nft_service.js` goes through `new Web3(window.ethereum)` — it doesn't call `eth_requestAccounts`, but it still hard-depends on a browser wallet extension being installed at all. An insurer or buyer on a phone browser with no MetaMask has no way to load the app today. `frontend/src/App.js` is also a single 535-line component with no router — there is no notion of a "page" separate from the wallet-gated main UI.

## Decision

Add `react-router-dom` and introduce a dedicated public route, `/lookup/:vin` (and a bare `/lookup` with a VIN input), that renders without requiring `window.ethereum` or a connected wallet. It reads chain state through a plain JSON-RPC HTTP provider (a new `REACT_APP_PUBLIC_RPC_URL` env var) instead of the injected provider, and displays: the current owner address, the full ownership history (reconstructed from indexed `Transfer` events), the current CID/metadata, and the existing update history from ADR 0027's `getTransactionHistoryForVin`. The main wallet-connected app gains a "Share proof of ownership" action next to a loaded VIN that copies/opens `${origin}/lookup/<vin>` and renders it as a QR code (new lightweight client-side QR dependency — no third-party QR-image web service, so the page works offline and never leaks the VIN to a third party just to render a code).

`VinCidRegistry` itself is unchanged. `tokenId` is derived the same way the contract does it (`keccak256(vin)`), client-side, to build the `Transfer` filter.

## Options Considered

### Option A — Dedicated public route + read-only RPC provider (chosen)
- **Pros:** Works with zero wallet extension installed, which is the actual requirement ("anyone... without needing a wallet"); reuses the existing trust-maximizing pattern from ADR 0027 (reconstruct from chain events, don't trust an off-chain claim); a real, bookmarkable/shareable URL; sets up routing infrastructure the marketplace work (a later ADR) will also need.
- **Cons:** New dependencies (`react-router-dom`, a QR library); needs a frontend-safe RPC endpoint to be provisioned (see Consequences) — a new piece of infrastructure this project didn't need before.

### Option B — Query-param view inside the existing single-page `App.js`, still no wallet required
- **Pros:** No new router dependency.
- **Cons:** `App.js` is already a 535-line component mixing wallet-connected and (hypothetically) public logic; a "does this need a wallet" branch inside one component tree is a worse foundation than a real route, especially with a marketplace page also coming later. Rejected as a false economy — avoids one dependency today at the cost of harder-to-reason-about UI state.

### Option C — Point users at Etherscan's own "Read Contract" tab instead of building a page
- **Pros:** Zero frontend work.
- **Cons:** Requires the viewer to already know how to use Etherscan's raw ABI-call UI, doesn't present a human-readable car record (make/model/year/mileage from the metadata JSON), and doesn't satisfy "anyone can type a VIN" — directly contradicts the stated requirement. Rejected.

## Consequences

- **Positive:** Ownership history and a shareable, independently-verifiable proof-of-ownership become available with no `VinCidRegistry` changes at all — `Transfer`'s indexed `tokenId` makes this cheaper than the `CidStored` reconstruction ADR 0027 already shipped. The public route is also the natural home for the vehicle-record and damage-flag data a later ADR (structured vehicle record) will add.
- **Negative:** A frontend-visible RPC endpoint must be provisioned. The private `SEPOLIA_RPC_URL` used by Hardhat deploy scripts (`hardhat.config.js`) **must not** be reused here — it ships in the frontend bundle and would be visible/exhaustible by every visitor. This needs either a public unauthenticated Sepolia RPC URL or a separately-issued, origin-restricted API key from a provider like Infura/Alchemy — a manual provisioning step outside this session's tools, same category as the Vercel env var updates from ADR 0028.
- **Frontend impact:** New router dependency and route; new `frontend/src/utils/public_rpc_client.js`; new ownership-history read function; new public-page component; new "Share proof of ownership" affordance in the existing wallet-connected view.
- **Contracts impact:** None. No new state, no new events, no redeploy/upgrade needed.
- **Follow-ups:** The structured-vehicle-record ADR should extend this same public page to show service history, documents, and damage flags once that data exists. The escrow/marketplace ADR will reuse the router this introduces.

## References

- `contracts/car_nft_sc.sol` — inherited `ERC721`/`Transfer` event and `_tokenIdFromVin` (`keccak256(vin)`), both reused unchanged.
- `docs/adr/0027-nft-transaction-provenance-link.md` — the CidStored-reconstruction precedent this follows, and the contrast with `Transfer`'s indexed `tokenId`.
- `frontend/src/App.js` — current single-page, wallet-gated structure being extended with a router.
- `frontend/src/utils/pinata_ipfs_nft_service.js:127` (`getTransactionHistoryForVin`) — reused by the public page for update history.
