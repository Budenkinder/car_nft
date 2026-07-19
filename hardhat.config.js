import "dotenv/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

const networks = {};
if (process.env.SEPOLIA_RPC_URL) {
  networks.sepolia = {
    type: "http",
    url: configVariable("SEPOLIA_RPC_URL"),
    accounts: process.env.DEPLOYER_PRIVATE_KEY
      ? [configVariable("DEPLOYER_PRIVATE_KEY")]
      : [],
  };
}

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
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
  verify: {
    etherscan: {
      // Etherscan V2 (unified across chains) — one key, no per-network map.
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
