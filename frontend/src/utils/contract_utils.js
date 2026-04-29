/**
 * Contract addresses for different networks
 */
export const CONTRACT_ADDRESSES = {
  // Sepolia testnet 11155111n:0xaa36a7
  "0xaa36a7": process.env.REACT_APP_SMART_CONTRACT_ADDRESS,
  // Add more networks as needed
};

/**
 * Get the contract address for the current network
 * @param {string} chainId - The current chain ID in hex format (e.g., "0xaa36a7")
 * @returns {string|null} - The contract address or null if not found
 */
export const getContractAddress = (chainId) => {
  console.log("getContractAddress::chainId: ", chainId);
  console.log("ENV contract:", process.env.REACT_APP_SMART_CONTRACT_ADDRESS);
  return CONTRACT_ADDRESSES[chainId] || null;
};
