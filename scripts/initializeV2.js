import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { network } from "hardhat";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// One-time follow-up for any proxy that was bootstrapped BEFORE ADR 0035 and
// has since been `upgradeToAndCall`'d to the ORG_ROLE-bearing implementation
// (scripts/upgrade.js swaps bytecode only — it does not call initializers).
// Until this runs, `hasRole(ORG_ROLE, ...)` is false for everyone, including
// the incumbent `minter`, so `storeCid` reverts for all callers. Safe to run
// exactly once per proxy (reinitializer(2) reverts on a second call, and any
// proxy bootstrapped via deploy.js after ADR 0035 already had this called
// automatically — running it again there will simply revert, harmlessly).
async function main() {
  const { ethers, networkName } = await network.create();
  const [deployer] = await ethers.getSigners();

  const artifactPath = path.join(rootDir, "deployments", `${networkName}.json`);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  console.log("Network:", networkName);
  console.log("Admin (deployer):", deployer.address);
  console.log("Proxy:", artifact.registry);

  const VinCidRegistry = await ethers.getContractFactory("VinCidRegistry");
  const registry = VinCidRegistry.attach(artifact.registry);

  const priorMinter = await registry.minter();
  console.log("Incumbent minter (will receive ORG_ROLE):", priorMinter);

  const tx = await registry.initializeV2(deployer.address);
  await tx.wait();
  console.log("initializeV2 complete. Tx:", tx.hash);

  const orgRole = await registry.ORG_ROLE();
  const adminRole = await registry.DEFAULT_ADMIN_ROLE();
  console.log("Deployer holds DEFAULT_ADMIN_ROLE:", await registry.hasRole(adminRole, deployer.address));
  console.log("Incumbent minter holds ORG_ROLE:", await registry.hasRole(orgRole, priorMinter));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
