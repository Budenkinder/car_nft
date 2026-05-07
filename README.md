# Car Repair NFT

A dApp that records vehicle repair history on-chain. Each car, identified by its 17-character VIN, gets a single NFT whose `tokenURI` points at the latest IPFS CID for that car's repair metadata. Updating a record updates the NFT's URI in place — no new mint — and successful writes pay out an ERC-20 reward (CRT) to the caller.

Flow diagram: https://excalidraw.com/#json=zV5wVQt8GJoK-GYiO-DQn,5mQBcgQrwVfJEm3sxA0Dyw

## Architecture

```
┌────────────┐    ┌──────────────┐    ┌─────────────────────┐
│  React UI  │───▶│  Pinata IPFS │    │  Sepolia Testnet    │
│ (MetaMask) │    │ (pin JSON)   │    │                     │
│            │    └──────┬───────┘    │ ┌─────────────────┐ │
│            │           │ CID        │ │ VinCidRegistry  │ │
│            │───────────┴───────────▶│ │ (ERC-721)       │ │
│            │                        │ └────────┬────────┘ │
│            │                        │          │ reward   │
│            │                        │ ┌────────▼────────┐ │
│            │                        │ │ CarRewardToken  │ │
│            │                        │ │ (ERC-20, CRT)   │ │
│            │                        │ └─────────────────┘ │
│            │◀───────────────────────│                     │
└────────────┘   read CID by VIN      └─────────────────────┘
```

1. User connects MetaMask (Sepolia) in the frontend.
2. On submit, the frontend pins a JSON metadata object to IPFS via Pinata and gets back a CID.
3. The frontend calls `VinCidRegistry.storeCid(vin, cid)`. First call mints the NFT for that VIN; later calls update its `tokenURI`.
4. The contract attempts to transfer `rewardAmount` of CRT to the caller (best-effort; silent on failure).
5. To read history, the UI calls `getCidByVin(vin)` and fetches the JSON from `https://gateway.pinata.cloud/ipfs/<cid>`.

## Repository layout

```
car_nft/
├── contracts/
│   ├── car_nft_sc.sol          # VinCidRegistry (ERC-721 URI storage)
│   └── car_reward_token.sol    # CarRewardToken (ERC-20, "CRT")
└── frontend/
    ├── public/
    │   ├── index.html
    │   └── _redirects          # SPA fallback (Netlify-style)
    ├── src/
    │   ├── App.js              # Search + create/update forms
    │   ├── components/
    │   │   └── MetaMaskLogin.jsx
    │   └── utils/
    │       ├── contract_abi.json
    │       ├── contract_utils.js          # chainId → contract address
    │       ├── pinata_ipfs_nft_service.js # IPFS pin + on-chain write
    │       └── validation.js              # VIN / CID / car-data checks
    ├── package.json
    └── vercel.json             # SPA rewrite for Vercel
```

## Smart contracts

### `VinCidRegistry` ([contracts/car_nft_sc.sol](contracts/car_nft_sc.sol))
ERC-721 with URI storage. Token id is `uint256(keccak256(bytes(vin)))`, so each VIN maps to exactly one NFT.

Key functions:
- `storeCid(string vin, string cid)` — mint or update. Requires `vin` length 17 and non-empty `cid`. Updates require `msg.sender` to be the owner or an approved operator. Emits `CidStored(vin, cid, tokenId)` and pays the reward.
- `getCidByVin(string vin) → string` — latest CID for a VIN.
- `getAllVins() → string[]` / `getAllCidsAsList() → string[]` — enumerate the registry.
- `setRewardToken(address)` / `setRewardAmount(uint256)` — owner-only configuration.

### `CarRewardToken` ([contracts/car_reward_token.sol](contracts/car_reward_token.sol))
Standard OpenZeppelin ERC-20 named `CarRewardToken` (symbol `CRT`). Mints 1,000,000,000 CRT to the deployer at construction; owner can `mint(to, amount)` more.

### Deployment (Remix walkthrough)
1. Deploy `CarRewardToken` first; copy its address.
2. Deploy `VinCidRegistry` with the CRT address as the constructor argument.
3. Call `setRewardAmount(amount)` on the registry (e.g., `1000000000000000000` for 1 CRT, since CRT uses 18 decimals).
4. Fund the registry with CRT: from the CRT contract, call `transfer(<registry address>, <amount>)`. The registry pays rewards out of its own balance, so a depleted balance simply means no reward (the write still succeeds — see `_payReward`'s `try/catch`).
5. Verify on Sepolia Etherscan and copy the registry address into `REACT_APP_SMART_CONTRACT_ADDRESS` (see below).

## Frontend

Stack: React 18 (CRA), Material UI 5, ethers v5, web3 v4, MetaMask provider.

### Environment variables
Create `frontend/.env` (CRA reads `REACT_APP_*` at build time — they end up in the bundle, so don't put truly secret keys here).

```
REACT_APP_SMART_CONTRACT_ADDRESS=<vin-cid-registry-address>   # VinCidRegistry on Sepolia
REACT_APP_PINATA_JWT=<your-pinata-jwt>                         # Pinata JWT (bearer auth)
REACT_APP_PINATA_API_URL=https://api.pinata.cloud/pinning     # required
```

The chain → contract mapping lives in [frontend/src/utils/contract_utils.js](frontend/src/utils/contract_utils.js); only Sepolia (`0xaa36a7`) is wired up. To support another network, add an entry there.

### Run locally
```
cd frontend
npm install
npm start            # http://localhost:3000
```

Other scripts: `npm run build`, `npm test`, `npm run clean` (nuke build + node_modules), `npm run fix-install` (cache-clean + reinstall).

### Using the app
1. Open the app and click **Connect Wallet**. Approve in MetaMask and switch to Sepolia if prompted.
2. **Search**: enter a 17-char VIN and click *Load Car NFT*. The app reads the CID from the contract and fetches the metadata from Pinata's gateway.
3. **Create / update**: fill in VIN, brand, model, year, issue, repair shop, mileage, then *Submit Repair*. The app pins the JSON to IPFS and calls `storeCid`. After confirmation, the tx hash links to Sepolia Etherscan.

## Deploying the frontend to Vercel

The repo already contains [frontend/vercel.json](frontend/vercel.json) with the SPA rewrite needed for client-side routing.

### Option A — Vercel Dashboard (recommended for first deploy)
1. Push the repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. **Root Directory**: set to `frontend` (the project lives in a subfolder).
4. **Framework Preset**: Create React App (auto-detected).
5. **Build Command**: `npm run build` (default).
6. **Output Directory**: `build` (default for CRA).
7. **Environment Variables** — add for *Production*, *Preview*, and *Development*:
   - `REACT_APP_SMART_CONTRACT_ADDRESS`
   - `REACT_APP_PINATA_JWT`
   - `REACT_APP_PINATA_API_URL`
8. Click **Deploy**. Subsequent pushes to the default branch redeploy automatically; PRs get preview URLs.

### Option B — Vercel CLI
```
npm i -g vercel
cd frontend
vercel login
vercel             # first run: link the project, pick "frontend" as root
vercel env add REACT_APP_SMART_CONTRACT_ADDRESS
vercel env add REACT_APP_PINATA_JWT
vercel env add REACT_APP_PINATA_API_URL
vercel --prod      # ship to production
```

### Notes on `vercel.json`
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```
This rewrites every path to `/` so deep-links (e.g., `/foo`) hit `index.html` and React handles routing. The `public/_redirects` file is for Netlify and is harmless on Vercel.

### After updating env vars
Vercel only injects env vars at build time for CRA. After changing one in the dashboard, trigger a redeploy (push a commit, or *Redeploy* from the Deployments tab) — otherwise the change won't appear in the bundle.

### Common gotchas
- **Blank page / 404 on refresh**: confirm the SPA rewrite is active.
- **`Contract address: null`**: `REACT_APP_SMART_CONTRACT_ADDRESS` isn't set for the target environment, or the user is on a chain other than Sepolia.
- **`Pinata 401/403`**: invalid, expired, or under-scoped Pinata JWT. The error now surfaces the response body — check it for the exact reason.
- **Reward not received**: registry's CRT balance is empty, or `rewardAmount` is `0`. The write still succeeded.
- **Secrets in the bundle**: anything prefixed `REACT_APP_` ships to the browser. Use a Pinata JWT scoped to pinning only; rotate if leaked.

## License
MIT — see [LICENSE](LICENSE).
