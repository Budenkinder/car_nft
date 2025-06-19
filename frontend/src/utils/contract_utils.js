/**
 * ABI for the Car NFT Smart Contract
 */
export const CAR_NFT_CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "vin",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "cid",
        type: "string",
      },
    ],
    name: "CidStored",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "vin",
        type: "string",
      },
      {
        internalType: "string",
        name: "cid",
        type: "string",
      },
    ],
    name: "storeCid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "vin",
        type: "string",
      },
    ],
    name: "getCidByVin",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

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
