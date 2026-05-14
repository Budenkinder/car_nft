# Car Repair NFT

A dApp that records vehicle repair history on-chain. Each car — identified by its 17-character VIN — gets a single NFT whose `tokenURI` points at the latest IPFS CID for that car's repair metadata. Only a designated `minter` address (a registry operator, separate from the contract `owner`) may register new VINs; the NFT is assigned to a `recipient` argument (typically the car owner's wallet). Updating a record rewrites the NFT's URI in place (no new mint), and the registry pays out an ERC-20 reward (CRT) to the recipient on the initial mint.

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

Write flow:

1. The **minter** operator (e.g. a registry admin) connects MetaMask (Sepolia) in the frontend. To register a new VIN, the connected wallet must equal the contract's `minter()`.
2. On submit, the frontend pins a JSON metadata object to IPFS via Pinata and gets back a CID.
3. The frontend calls `VinCidRegistry.storeCid(vin, cid, recipient)`. The first call for a VIN mints its NFT to `recipient` (the car owner). Later calls update the `tokenURI` — updates are open in this POC build (anyone can call them).
4. On mint only, the registry attempts to transfer `rewardAmount` of CRT to the `recipient` (best-effort — silent on failure, so the write still succeeds if funding is empty).
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

Two roles:

- `owner()` — admin (set at deploy via `Ownable`). Configures reward params and the minter.
- `minter` — registry operator authorized to register new VINs. Set at deploy and changeable by `owner` via `setMinter(address)`. Updates to existing records are open in this POC and do not require either role.

Key functions:

- `storeCid(string vin, string cid, address recipient)` — mint or update. Requires `vin` length 17 and non-empty `cid`. On a new mint, `msg.sender` must be `minter` and `recipient` must be non-zero; the NFT is minted to `recipient` and the CRT reward is paid to `recipient`. On updates, `recipient` is ignored. Emits `CidStored(vin, cid, tokenId)`.
- `minter() → address` / `setMinter(address)` — read or update the minter (`setMinter` is owner-only). Emits `MinterChanged(previousMinter, newMinter)`.
- `getCidByVin(string vin) → string` — latest CID for a VIN.
- `getAllVins() → string[]` / `getAllCidsAsList() → string[]` — enumerate the registry.
- `setRewardToken(address)` / `setRewardAmount(uint256)` — owner-only configuration.
- `withdrawToken(IERC20, address, uint256)` — owner-only; recover ERC-20 funds held by the registry.

### `CarRewardToken` ([contracts/car_reward_token.sol](contracts/car_reward_token.sol))

Standard OpenZeppelin ERC-20 named `CarRewardToken` (symbol `CRT`). Mints 1,000,000,000 CRT to the deployer at construction; the owner can `mint(to, amount)` more later.

## Deploying to Sepolia

End-to-end walkthrough using Remix + MetaMask. Two contracts, configured in sequence:

> deploy CRT → deploy registry (pointing at CRT, with initial minter address) → set reward amount → fund the registry

The "deployer" account becomes the contract `owner` (admin). The minter address can be the same as the deployer (simplest, single-wallet demo) or a separate operator wallet (more realistic — see [Roles](#roles)). All admin steps run from the deployer account; only registering new VINs runs from the minter account.

### Prerequisites

- MetaMask with ~0.05 Sepolia ETH on the deployer account (faucet: <https://cloud.google.com/application/web3/faucet/ethereum/sepolia>).
- Both contracts loaded in [Remix](https://remix.ethereum.org).
- Compiler set to Solidity `0.8.24` or higher (matches `pragma ^0.8.24`).
- Compile both `car_reward_token.sol` and `car_nft_sc.sol` — green checkmark, no errors.

### 1. Connect Remix to Sepolia

In Remix → **Deploy & Run Transactions**:

- **Environment**: `Injected Provider - MetaMask`
- **Account**: deployer address with Sepolia ETH
- The network line below should read `Custom (11155111)` — Sepolia's chain ID
- In MetaMask itself, confirm the active network is **Sepolia**

### 2. Deploy `CarRewardToken`

CRT goes first because the registry's constructor requires its address.

- **Contract** dropdown → `CarRewardToken`
- Click **Deploy** → confirm in MetaMask → wait for confirmation

The full 1,000,000,000 CRT supply mints to the deployer account.

Sanity checks (blue / view-only buttons):

| Function | Expected |
|---|---|
| `name` | `CarRewardToken` |
| `symbol` | `CRT` |
| `decimals` | `18` |
| `totalSupply` | `1000000000000000000000000000` |
| `balanceOf(<deployer>)` | same as `totalSupply` |

Save the deployed CRT address — you'll paste it into the registry's constructor next.

### 3. Deploy `VinCidRegistry`

- **Contract** dropdown → `VinCidRegistry`
- Constructor input `rewardTokenAddress`: paste the **CRT address** from step 2
- Constructor input `initialMinter`: the wallet address authorized to register new VINs. For a single-wallet demo, paste the **deployer address**. For a two-wallet demo, paste the **operator address** (a different MetaMask account).
- Click **Deploy** → confirm in MetaMask

The deployer account becomes the registry's `Ownable` admin (`owner`); the address you passed as `initialMinter` becomes `minter`.

```
CarRewardToken (deployed first)
        │
        ▼
   0xAbC...123  ◀── copy
        │
        ▼  paste as rewardTokenAddress
VinCidRegistry(0xAbC...123, 0xMint...er)
                            ▲
                            └── initialMinter
```

Sanity checks:

| Function | Expected |
|---|---|
| `name` | `VinCidRegistry` |
| `symbol` | `VIN` |
| `owner` | deployer address |
| `minter` | the `initialMinter` you passed |
| `rewardToken` | CRT address from step 2 |
| `rewardAmount` | `0` *(set in step 4)* |
| `getAllVins` | `[]` |

Save the deployed registry address. This is what goes into the frontend as `REACT_APP_SMART_CONTRACT_ADDRESS`.

To rotate the minter later (owner-only): call `setMinter(<new minter address>)`. Emits `MinterChanged(previousMinter, newMinter)`.

### 4. Set the reward amount (owner-only)

On `VinCidRegistry` → `setRewardAmount`:

- `amount`: `1000000000000000000` *(= 1 CRT, since CRT has 18 decimals)*

Confirm in MetaMask. Verify with `rewardAmount` → returns `1000000000000000000`.

### 5. Fund the registry with CRT

The registry pays rewards out of its own balance. Without funding, writes still succeed but `_payReward` silently no-ops.

From the deployer account, on `CarRewardToken` → `transfer`:

- `to`: `<VinCidRegistry address>`
- `amount`: `1000000000000000000000` *(= 1000 CRT, ~1000 rewards at 1 CRT each)*

Verify with `balanceOf(<registry address>)` → returns `1000000000000000000000`.

### Refilling the registry

After ~1000 writes the registry's CRT balance runs out. To refill, the deployer runs another `transfer` from CRT → registry for the desired amount.

### Roles

| Role | Set by | Authority |
|---|---|---|
| `owner()` | `Ownable` constructor (= deployer) | Configures `rewardToken`, `rewardAmount`, `minter`. Can `withdrawToken`. |
| `minter` | Constructor arg `initialMinter` (changeable by `owner` via `setMinter`) | Authorized to register new VINs via `storeCid` (the mint path). |
| Anyone | — | Can update an existing VIN's CID (POC behavior; lock down later if needed). |

### Reference deployment (Sepolia)

> The reference addresses below were deployed against the **previous** single-owner-mint contract API. Redeploy after applying this version (the constructor signature changed: `(rewardTokenAddress, initialMinter)`).

| Component | Value |
|---|---|
| `CarRewardToken` (CRT) | `0x3c9F25A1547cc647CA6c9A04AA5C5093504BF31f` *(reusable as-is)* |
| `VinCidRegistry` | *redeploy required* |
| Network | Sepolia (chain ID `11155111`) |
| Reward per write | 1 CRT |
| Initial registry funding | 1000 CRT |

## Frontend

Stack: React 18 (CRA), Material UI 5, ethers v5, web3 v4, MetaMask provider.

### Environment variables

Create `frontend/.env`. CRA reads `REACT_APP_*` at build time and inlines them into the bundle, so **do not put truly secret keys here**.

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

1. Open the app and click **Connect Wallet**. Approve in MetaMask and switch to Sepolia if prompted. The "Create or Update" panel shows the contract's current `minter` address and whether your connected wallet matches.
2. **Search**: enter a 17-char VIN and click *Load Car NFT*. The app reads the CID from the contract and fetches the metadata from Pinata's gateway. After this call the app knows whether the VIN already exists on-chain (controls which fields/buttons appear next).
3. **Register a new car (mint)**: the connected wallet must be the **minter**. Fill in VIN, **Car Owner Wallet (recipient)**, brand, model, year, issue, repair shop, mileage, then *Register New Car NFT*. The app pins the JSON to IPFS and calls `storeCid(vin, cid, recipient)`. The NFT lands in the recipient's wallet; the CRT reward is also paid to the recipient.
4. **Update an existing car**: any connected wallet works (POC behavior). The Recipient field is hidden because the NFT already exists; the update is applied to that VIN's existing NFT. Click *Submit Repair Update*.
5. After confirmation, the tx hash links to Sepolia Etherscan.

## Deploying the frontend to Vercel

The repo already contains [frontend/vercel.json](frontend/vercel.json) with the SPA rewrite needed for client-side routing.

### Option A — Vercel Dashboard (recommended for first deploy)

1. Push the repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. **Root Directory**: `frontend` (the project lives in a subfolder).
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

Every path rewrites to `/` so deep-links (e.g. `/foo`) hit `index.html` and React handles routing. The `public/_redirects` file is for Netlify and is harmless on Vercel.

### After updating env vars

Vercel only injects env vars at build time for CRA. After changing one in the dashboard, trigger a redeploy (push a commit, or *Redeploy* from the Deployments tab) — otherwise the change won't appear in the bundle.

## Troubleshooting

- **Blank page / 404 on refresh** — confirm the SPA rewrite in `vercel.json` is active.
- **`Contract address: null`** — `REACT_APP_SMART_CONTRACT_ADDRESS` isn't set for the target environment, or the user is on a chain other than Sepolia.
- **`Pinata 401/403`** — invalid, expired, or under-scoped Pinata JWT. The error surfaces the response body — check it for the exact reason.
- **Reward not received** — registry's CRT balance is empty, or `rewardAmount` is `0`. The write itself still succeeded.
- **Secrets in the bundle** — anything prefixed `REACT_APP_` ships to the browser. Scope the Pinata JWT to pinning only, and rotate if leaked.

## License

Apache 2.0 — see [LICENSE](LICENSE).
