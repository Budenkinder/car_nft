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
