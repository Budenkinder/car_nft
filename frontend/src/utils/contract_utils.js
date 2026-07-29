import { netLog } from "./logger";

/**
 * Contract addresses for different networks
 */
export const CONTRACT_ADDRESSES = {
  // Sepolia testnet (11155111)
  "0xaa36a7": process.env.REACT_APP_SMART_CONTRACT_ADDRESS,
  // Hardhat node (31337) — populated from `npx hardhat run scripts/deploy.js --network localhost`
  "0x7a69": process.env.REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL,
};

/**
 * Get the contract address for the current network
 * @param {string} chainId - The current chain ID in hex format (e.g., "0xaa36a7")
 * @returns {string|null} - The contract address or null if not found
 */
export const getContractAddress = (chainId) => {
  const address = CONTRACT_ADDRESSES[chainId] || null;
  if (!address) {
    netLog.warn("No contract address configured", { chainId });
  } else {
    netLog.debug("Resolved contract address", { chainId, address });
  }
  return address;
};

/**
 * Block the registry was deployed at, for each network. Used to bound
 * `CidStored` event scans instead of scanning from genesis.
 */
const CONTRACT_DEPLOY_BLOCKS = {
  "0xaa36a7": process.env.REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK,
  "0x7a69": process.env.REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL,
};

/**
 * Get the block the contract was deployed at for the current network.
 * Falls back to 0 (full scan) when unset or unparsable — covers deployments
 * that predate this field, e.g. the currently-live Sepolia deployment.
 * @param {string} chainId - The current chain ID in hex format (e.g., "0xaa36a7")
 * @returns {number}
 */
export const getContractDeployBlock = (chainId) => {
  const raw = CONTRACT_DEPLOY_BLOCKS[chainId];
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};
