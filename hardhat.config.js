require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const networks = {};
if (process.env.SEPOLIA_RPC_URL) {
  networks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: process.env.DEPLOYER_PRIVATE_KEY
      ? [process.env.DEPLOYER_PRIVATE_KEY]
      : [],
  };
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      // OpenZeppelin v5 emits `mcopy`, which requires Cancun.
      // Sepolia and mainnet both support it.
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks,
  etherscan: {
    // Etherscan V2 (unified across chains) — one key, no per-network map.
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  sourcify: {
    // Silence the "Sourcify Skipped" notice. Flip to true if you also want
    // to verify on https://sourcify.dev.
    enabled: false,
  },
};
