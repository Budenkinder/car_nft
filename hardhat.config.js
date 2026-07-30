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
    // Hardhat 3 only emits artifacts for "root" files under contracts/ by
    // default; ERC1967Proxy is never imported by our own contracts (it's
    // deployed directly from scripts/deploy.js and test fixtures), so it
    // must be listed explicitly to get an artifact. See ADR 0028.
    npmFilesToBuild: ["@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol"],
  },
  networks,
  test: {
    mocha: {
      // `npm test` stays human-readable (spec); `npm run test:report`
      // switches to the JSON reporter via MOCHA_REPORTER to feed the
      // generated docs/testing/automated-test-report.md.
      reporter: process.env.MOCHA_REPORTER || "spec",
    },
  },
  verify: {
    etherscan: {
      // Etherscan V2 (unified across chains) — one key, no per-network map.
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
