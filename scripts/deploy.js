import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { network } from "hardhat";
import { upsertEnvVar, syncFrontendAbi, writeSepoliaDeployLog } from "./deployUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// One-time bootstrap per network: deploys CarRewardToken, deploys the
// VinCidRegistry implementation, and deploys an ERC1967Proxy in front of it
// (calling `initialize` as the proxy's constructor calldata). All LATER
// upgrades go through `scripts/upgrade.js`, which swaps only the
// implementation and never touches the proxy address. See ADR 0028.
async function main() {
  const { ethers, networkName } = await network.create();
  const { chainId } = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("Network: ", networkName, "(chainId:", chainId.toString() + ")");
  console.log("Deployer:", deployer.address);
  console.log("Balance: ", ethers.formatEther(balance), "ETH");

  const dir = path.join(rootDir, "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const artifactPath = path.join(dir, `${networkName}.json`);

  // Guard: bootstrapping twice against the same network would silently spin
  // up a second, disconnected registry (different proxy address) instead of
  // upgrading the existing one. Use scripts/upgrade.js for that instead.
  if (fs.existsSync(artifactPath) && process.env.FORCE_FRESH_DEPLOY !== "1") {
    const existing = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    if (existing.registry) {
      console.error(
        `\n${networkName} already has a bootstrapped registry at ${existing.registry} (see ${artifactPath}).\n` +
          `Run \`npm run upgrade:${networkName}\` to change the implementation instead.\n` +
          "Set FORCE_FRESH_DEPLOY=1 to bootstrap a brand-new, disconnected registry anyway (starts with empty storage)."
      );
      process.exitCode = 1;
      return;
    }
  }

  // 1. Deploy the ERC-20 reward token (no constructor args).
  console.log("\nDeploying CarRewardToken...");
  const CarRewardToken = await ethers.getContractFactory("CarRewardToken");
  const rewardToken = await CarRewardToken.deploy();
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("CarRewardToken:", rewardTokenAddress);

  // 2. Deploy the VinCidRegistry implementation, then an ERC1967Proxy in
  //    front of it, calling initialize(rewardTokenAddress, initialMinter) as
  //    the proxy's constructor calldata (replaces the old direct
  //    VinCidRegistry.deploy(rewardTokenAddress, initialMinter) constructor call).
  const initialMinter = process.env.INITIAL_MINTER || deployer.address;
  console.log("\nDeploying VinCidRegistry implementation...");
  const VinCidRegistry = await ethers.getContractFactory("VinCidRegistry");
  const implementation = await VinCidRegistry.deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();
  console.log("VinCidRegistry implementation:", implementationAddress);

  console.log("\nDeploying ERC1967Proxy...");
  console.log("  rewardToken:  ", rewardTokenAddress);
  console.log("  initialMinter:", initialMinter);
  const initData = VinCidRegistry.interface.encodeFunctionData("initialize", [
    rewardTokenAddress,
    initialMinter,
  ]);
  const Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await Proxy.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();
  const registryAddress = await proxy.getAddress();
  console.log("VinCidRegistry (proxy):", registryAddress);
  const registry = VinCidRegistry.attach(registryAddress);

  // Deployment block, so the frontend can bound its `CidStored` event scan
  // with `fromBlock` instead of scanning from genesis (ADR 0027). This is the
  // proxy's own deployment block — `CidStored` is always emitted at the
  // proxy address regardless of which implementation is currently active.
  const deployTx = proxy.deploymentTransaction();
  const deployedAtBlock = deployTx?.blockNumber ?? (await deployTx.wait()).blockNumber;

  // 3. Persist addresses BEFORE the funding step — so a funding failure does
  //    not strand the deployed addresses in console output only.
  const artifact = {
    network: networkName,
    chainId: chainId.toString(),
    deployer: deployer.address,
    rewardToken: rewardTokenAddress,
    registry: registryAddress,
    implementation: implementationAddress,
    initialMinter,
    deployedAt: new Date().toISOString(),
    deployedAtBlock,
  };
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
      const rewardAmount = ethers.parseUnits(rewardAmountStr, 18);
      const fundAmount = ethers.parseUnits(fundAmountStr, 18);
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
  const envPath = path.join(rootDir, "frontend", ".env.local");
  if (networkName === "localhost" || networkName === "hardhat") {
    const key = "REACT_APP_SMART_CONTRACT_ADDRESS_LOCAL";
    const blockKey = "REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK_LOCAL";
    upsertEnvVar(envPath, key, registryAddress);
    upsertEnvVar(envPath, blockKey, deployedAtBlock);
    console.log(`Updated ${envPath} (${key}=${registryAddress}, ${blockKey}=${deployedAtBlock})`);
    console.log("Restart the React dev server to pick up the new address.");
  } else if (networkName === "sepolia") {
    const key = "REACT_APP_SMART_CONTRACT_ADDRESS";
    const blockKey = "REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK";
    upsertEnvVar(envPath, key, registryAddress);
    upsertEnvVar(envPath, blockKey, deployedAtBlock);
    console.log(`Updated ${envPath} (${key}=${registryAddress}, ${blockKey}=${deployedAtBlock})`);
    console.log("Restart the React dev server to pick up the new address.");
    console.log(
      "\nFor production, also set in Vercel → Project Settings → Environment Variables (Production):"
    );
    console.log(`  REACT_APP_SMART_CONTRACT_ADDRESS=${registryAddress}`);
    console.log(`  REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK=${deployedAtBlock}`);
    console.log(
      "Then trigger a redeploy of `main` so the new bundle picks it up. This is a one-time step:" +
        " future upgrades (`npm run upgrade:sepolia`) leave this address unchanged."
    );
  } else {
    console.log(`Add a ${networkName} entry to frontend/src/utils/contract_utils.js:`);
    console.log(registryAddress);
  }

  // Sepolia deploy log: a dated, human-readable record of the deployed addresses
  // with Etherscan links, under docs/deployments/. Same-day re-deploys overwrite.
  if (networkName === "sepolia") {
    console.log("\n--- Sepolia deploy log ---");
    const date = artifact.deployedAt.slice(0, 10);
    const logPath = writeSepoliaDeployLog(rootDir, {
      kind: "bootstrap",
      date,
      chainId: artifact.chainId,
      actor: artifact.deployer,
      timestamp: artifact.deployedAt,
      deployedAtBlock: artifact.deployedAtBlock,
      registryAddress,
      implementationAddress,
      rewardTokenAddress,
    });
    console.log(`Wrote ${logPath}`);
  }

  // Sync the frontend ABI from the freshly compiled VinCidRegistry artifact, so
  // the UI's ABI never drifts from the deployed contract. Runs on every network.
  console.log("\n--- Frontend ABI sync ---");
  const abiDest = syncFrontendAbi(rootDir);
  console.log(`Updated ${abiDest}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
