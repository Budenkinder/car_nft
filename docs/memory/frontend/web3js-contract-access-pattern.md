---
name: web3js-contract-access-pattern
description: Frontend uses web3.js (not ethers); all contract calls funnel through pinata_ipfs_nft_service.js
metadata:
  type: project
  scope: frontend
---

The React frontend talks to the chain with **web3.js** (`new Web3(window.ethereum)`, `contract.methods.X().call()` / `.send()`), **not ethers** — even though the Hardhat side uses ethers. Every contract read and write lives in `frontend/src/utils/pinata_ipfs_nft_service.js`; UI components never construct a contract instance directly. The standard read shape is: build `web3` from `window.ethereum`, resolve the address via `getContractAddress(chainId)` from `contract_utils.js` (returns `null` on an unconfigured network), construct `new web3.eth.Contract(contractAbi, address)`, then `await contract.methods.<fn>().call()`. The ABI is the static `frontend/src/utils/contract_abi.json` (VinCidRegistry only). See `getMinterAddress` / `getAllRegisteredNfts` as canonical examples.

**Why:** Mixing ethers (Hardhat's default) into the frontend would split the contract-access style and duplicate provider wiring; keeping every call in one web3.js service module keeps logging (`netLog`/`txLog`), address resolution, and error handling consistent.

**How to apply:** When adding a new contract interaction, add an exported function to `pinata_ipfs_nft_service.js` following the `getMinterAddress` pattern — do not reach for ethers and do not build a contract instance inside a component. Read functions should return a safe empty value (`null`/`[]`) and log via `netLog` on failure rather than throwing into the UI. Related: [[plan-status-folders]].
