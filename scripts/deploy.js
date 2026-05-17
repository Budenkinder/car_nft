require("dotenv").config();
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

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
  if (network === "localhost" || network === "hardhat") {
    const envPath = path.join(__dirname, "..", "frontend", ".env.local");
    const key = "REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL";
    const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
    const linePattern = new RegExp(`^${key}=.*$`, "m");
    const next = linePattern.test(existing)
      ? existing.replace(linePattern, `${key}=${registryAddress}`)
      : `${existing.replace(/\s+$/, "")}\n${key}=${registryAddress}\n`;
    fs.writeFileSync(envPath, next);
    console.log(`Updated ${envPath} (${key}=${registryAddress})`);
    console.log("Restart the React dev server to pick up the new address.");
  } else if (network === "sepolia") {
    console.log("Set the following in Vercel → Project Settings → Environment Variables (Production):");
    console.log(`  REACT_APP_SMART_CONTRACT_ADDRESS=${registryAddress}`);
    console.log("Then trigger a redeploy of `main` so the new bundle picks it up.");
  } else {
    console.log(`Add a ${network} entry to frontend/src/utils/contract_utils.js:`);
    console.log(registryAddress);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
