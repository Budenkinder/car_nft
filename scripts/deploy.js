require("dotenv").config();
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

// Upserts `KEY=value` in an env file: replaces the line if present, appends otherwise.
function upsertEnvVar(envPath, key, value) {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const linePattern = new RegExp(`^${key}=.*$`, "m");
  const next = linePattern.test(existing)
    ? existing.replace(linePattern, `${key}=${value}`)
    : `${existing.replace(/\s+$/, "")}\n${key}=${value}\n`;
  fs.writeFileSync(envPath, next);
}

async function main() {
  const network = hre.network.name;
  const { chainId } = await hre.ethers.provider.getNetwork();
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Network: ", network, "(chainId:", chainId.toString() + ")");
  console.log("Deployer:", deployer.address);
  console.log("Balance: ", hre.ethers.formatEther(balance), "ETH");

  // 1. Deploy the ERC-20 reward token (no constructor args).
  console.log("\nDeploying CarRewardToken...");
  const CarRewardToken = await hre.ethers.getContractFactory("CarRewardToken");
  const rewardToken = await CarRewardToken.deploy();
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("CarRewardToken:", rewardTokenAddress);

  // 2. Deploy the VIN registry. Constructor: (rewardTokenAddress, initialMinter)
  const initialMinter = process.env.INITIAL_MINTER || deployer.address;
  console.log("\nDeploying VinCidRegistry...");
  console.log("  rewardToken:  ", rewardTokenAddress);
  console.log("  initialMinter:", initialMinter);
  const VinCidRegistry = await hre.ethers.getContractFactory("VinCidRegistry");
  const registry = await VinCidRegistry.deploy(rewardTokenAddress, initialMinter);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("VinCidRegistry:", registryAddress);

  // 3. Persist addresses BEFORE the funding step — so a funding failure does
  //    not strand the deployed addresses in console output only.
  const artifact = {
    network,
    chainId: chainId.toString(),
    deployer: deployer.address,
    rewardToken: rewardTokenAddress,
    registry: registryAddress,
    initialMinter,
    deployedAt: new Date().toISOString(),
  };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const artifactPath = path.join(dir, `${network}.json`);
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  console.log("\nDeployment artifact written:", artifactPath);

  // 4. Optional: fund the registry with CRT and set the per-mint reward.
  //    Set REWARD_AMOUNT or REWARD_FUND to "0" to skip this step.
  const rewardAmountStr = process.env.REWARD_AMOUNT ?? "10";
  const fundAmountStr = process.env.REWARD_FUND ?? "1000000";

  if (rewardAmountStr === "0" || fundAmountStr === "0") {
    console.log("\nSkipping reward funding (REWARD_AMOUNT or REWARD_FUND = 0).");
  } else {
    try {
      const rewardAmount = hre.ethers.parseUnits(rewardAmountStr, 18);
      const fundAmount = hre.ethers.parseUnits(fundAmountStr, 18);
      console.log(
        `\nFunding registry: ${fundAmountStr} CRT pool, ${rewardAmountStr} CRT/mint...`
      );
      await (await rewardToken.transfer(registryAddress, fundAmount)).wait();
      await (await registry.setRewardAmount(rewardAmount)).wait();
      console.log("Funding complete.");
    } catch (error) {
      console.error("\nFunding step failed:", error.message);
      console.error(
        "Addresses are saved in",
        artifactPath + ".",
        "\nRe-run the transfer + setRewardAmount calls manually, or run deploy again with REWARD_FUND=0 to skip."
      );
      process.exitCode = 1;
      return;
    }
  }

  console.log("\n--- Frontend wiring ---");
  const envPath = path.join(__dirname, "..", "frontend", ".env.local");
  if (network === "localhost" || network === "hardhat") {
    const key = "REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL";
    upsertEnvVar(envPath, key, registryAddress);
    console.log(`Updated ${envPath} (${key}=${registryAddress})`);
    console.log("Restart the React dev server to pick up the new address.");
  } else if (network === "sepolia") {
    const key = "REACT_APP_SMART_CONTRACT_ADDRESS";
    upsertEnvVar(envPath, key, registryAddress);
    console.log(`Updated ${envPath} (${key}=${registryAddress})`);
    console.log("Restart the React dev server to pick up the new address.");
    console.log(
      "\nFor production, also set in Vercel → Project Settings → Environment Variables (Production):"
    );
    console.log(`  REACT_APP_SMART_CONTRACT_ADDRESS=${registryAddress}`);
    console.log("Then trigger a redeploy of `main` so the new bundle picks it up.");
  } else {
    console.log(`Add a ${network} entry to frontend/src/utils/contract_utils.js:`);
    console.log(registryAddress);
  }

  // Sepolia deploy log: a dated, human-readable record of the deployed addresses
  // with Etherscan links, under docs/deployments/. Same-day re-deploys overwrite.
  if (network === "sepolia") {
    console.log("\n--- Sepolia deploy log ---");
    const date = artifact.deployedAt.slice(0, 10);
    const etherscan = (addr) => `https://sepolia.etherscan.io/address/${addr}`;
    const logDir = path.join(__dirname, "..", "docs", "deployments");
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(
      logDir,
      `sepolia_contract_deploy_addresses_${date}.md`
    );
    const logBody = `# Sepolia Contract Deployment — ${date}

- **Network:** ${network} (chainId ${artifact.chainId})
- **Deployer:** ${artifact.deployer}
- **Deployed at:** ${artifact.deployedAt}

## Contract Addresses

| Contract | Address (click for Etherscan) |
|----------|-------------------------------|
| VinCidRegistry | [\`${registryAddress}\`](${etherscan(registryAddress)}) |
| CarRewardToken | [\`${rewardTokenAddress}\`](${etherscan(rewardTokenAddress)}) |
`;
    fs.writeFileSync(logPath, logBody);
    console.log(`Wrote ${logPath}`);
  }

  // Sync the frontend ABI from the freshly compiled VinCidRegistry artifact, so
  // the UI's ABI never drifts from the deployed contract. Runs on every network.
  console.log("\n--- Frontend ABI sync ---");
  const abiSrc = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "car_nft_sc.sol",
    "VinCidRegistry.json"
  );
  if (!fs.existsSync(abiSrc)) {
    console.error(
      `Compiled artifact not found at ${abiSrc}.\nRun \`npm run compile\` before deploying.`
    );
    process.exitCode = 1;
    return;
  }
  const abiDest = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "utils",
    "contract_abi.json"
  );
  const { abi } = JSON.parse(fs.readFileSync(abiSrc, "utf8"));
  fs.writeFileSync(abiDest, JSON.stringify(abi, null, 2) + "\n");
  console.log(`Updated ${abiDest}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
