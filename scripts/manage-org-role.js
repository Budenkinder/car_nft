import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { network } from "hardhat";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Terminal tool for the contract deployer (DEFAULT_ADMIN_ROLE) to grant or
// revoke ORG_ROLE for a wallet, without hand-crafting an Etherscan
// transaction (ADR 0035; decision 2026-08-04-002). Scoped to ORG_ROLE only —
// VERIFIER_ROLE is unused (decision 2026-08-03-004) and gets its own tooling
// if and when it is activated.
//
// Usage:
//   TARGET_WALLET=0x... npm run org-role:local
//   TARGET_WALLET=0x... ROLE_ACTION=revoke npm run org-role:sepolia
async function main() {
  const targetWallet = process.env.TARGET_WALLET;
  const action = (process.env.ROLE_ACTION || "grant").toLowerCase();

  if (!targetWallet) {
    console.error(
      "TARGET_WALLET is required, e.g.:\n" +
        "  TARGET_WALLET=0x... npm run org-role:local\n" +
        "  TARGET_WALLET=0x... ROLE_ACTION=revoke npm run org-role:sepolia"
    );
    process.exitCode = 1;
    return;
  }
  if (action !== "grant" && action !== "revoke") {
    console.error(`ROLE_ACTION must be "grant" or "revoke" (got "${action}").`);
    process.exitCode = 1;
    return;
  }

  const { ethers, networkName } = await network.create();
  if (!ethers.isAddress(targetWallet)) {
    console.error(`TARGET_WALLET "${targetWallet}" is not a valid address.`);
    process.exitCode = 1;
    return;
  }

  const artifactPath = path.join(rootDir, "deployments", `${networkName}.json`);
  if (!fs.existsSync(artifactPath)) {
    console.error(
      `No deployment found for ${networkName} at ${artifactPath}.\n` +
        `Run \`npm run deploy:${networkName}\` first.`
    );
    process.exitCode = 1;
    return;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const [deployer] = await ethers.getSigners();
  const VinCidRegistry = await ethers.getContractFactory("VinCidRegistry");
  const registry = VinCidRegistry.attach(artifact.registry);

  const orgRole = await registry.ORG_ROLE();
  const isAdmin = await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), deployer.address);
  if (!isAdmin) {
    console.error(
      `${deployer.address} does not hold DEFAULT_ADMIN_ROLE on ${artifact.registry} — cannot ${action} ORG_ROLE.`
    );
    process.exitCode = 1;
    return;
  }

  console.log("Network:      ", networkName);
  console.log("Registry:     ", artifact.registry);
  console.log("Admin (you):  ", deployer.address);
  console.log("Target wallet:", targetWallet);
  console.log("Action:       ", action);

  const tx =
    action === "grant"
      ? await registry.connect(deployer).grantRole(orgRole, targetWallet)
      : await registry.connect(deployer).revokeRole(orgRole, targetWallet);
  console.log(`\nSubmitted ${tx.hash} — waiting for confirmation...`);
  await tx.wait();

  const hasOrgRole = await registry.hasRole(orgRole, targetWallet);
  console.log(`\nDone. hasRole(ORG_ROLE, ${targetWallet}) = ${hasOrgRole}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
