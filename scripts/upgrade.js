import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { network } from "hardhat";
import { syncFrontendAbi, writeSepoliaDeployLog } from "./deployUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Upgrades an already-bootstrapped VinCidRegistry proxy to a newly compiled
// implementation. Deploys the new implementation, calls `upgradeToAndCall` on
// the existing proxy (must be called by the contract owner), and re-syncs the
// frontend ABI. The proxy address itself — and every VIN/CID it has
// registered — is untouched. See ADR 0028 and scripts/deploy.js (bootstrap).
async function main() {
  const { ethers, networkName } = await network.create();
  const { chainId } = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();

  const artifactPath = path.join(rootDir, "deployments", `${networkName}.json`);
  if (!fs.existsSync(artifactPath)) {
    console.error(
      `No deployment found for ${networkName} at ${artifactPath}.\n` +
        `Run \`npm run deploy:${networkName}\` (bootstrap) first.`
    );
    process.exitCode = 1;
    return;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  if (!artifact.registry) {
    console.error(`${artifactPath} has no \`registry\` (proxy) address — bootstrap first.`);
    process.exitCode = 1;
    return;
  }

  console.log("Network: ", networkName, "(chainId:", chainId.toString() + ")");
  console.log("Upgrader:", deployer.address);
  console.log("Existing proxy (registry):    ", artifact.registry);
  console.log("Existing implementation:      ", artifact.implementation);

  console.log("\nDeploying new VinCidRegistry implementation...");
  const VinCidRegistry = await ethers.getContractFactory("VinCidRegistry");
  const newImplementation = await VinCidRegistry.deploy();
  await newImplementation.waitForDeployment();
  const newImplementationAddress = await newImplementation.getAddress();
  console.log("New implementation:", newImplementationAddress);

  const proxy = VinCidRegistry.attach(artifact.registry);
  console.log("\nUpgrading proxy to the new implementation...");
  await (await proxy.upgradeToAndCall(newImplementationAddress, "0x")).wait();
  console.log("Upgrade complete. Proxy address unchanged:", artifact.registry);

  const upgradedAt = new Date().toISOString();
  const updatedArtifact = {
    ...artifact,
    implementation: newImplementationAddress,
    upgradedAt,
  };
  fs.writeFileSync(artifactPath, JSON.stringify(updatedArtifact, null, 2));
  console.log("Updated deployment artifact:", artifactPath);

  // Re-sync the ABI — an upgrade may add new methods. The proxy address in
  // frontend/.env.local (REACT_APP_SMART_CONTRACT_ADDRESS*) does NOT need to
  // change; that is the whole point of the proxy pattern (ADR 0028).
  console.log("\n--- Frontend ABI sync ---");
  const abiDest = syncFrontendAbi(rootDir);
  console.log(`Updated ${abiDest}`);

  if (networkName === "sepolia") {
    console.log("\n--- Sepolia deploy log ---");
    const date = upgradedAt.slice(0, 10);
    const logPath = writeSepoliaDeployLog(rootDir, {
      kind: "upgrade",
      date,
      chainId: updatedArtifact.chainId,
      actor: deployer.address,
      timestamp: upgradedAt,
      deployedAtBlock: updatedArtifact.deployedAtBlock,
      registryAddress: updatedArtifact.registry,
      implementationAddress: newImplementationAddress,
    });
    console.log(`Wrote ${logPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
