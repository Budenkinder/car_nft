import fs from "fs";
import path from "path";

// Upserts `KEY=value` in an env file: replaces the line if present, appends otherwise.
export function upsertEnvVar(envPath, key, value) {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const linePattern = new RegExp(`^${key}=.*$`, "m");
  const next = linePattern.test(existing)
    ? existing.replace(linePattern, `${key}=${value}`)
    : `${existing.replace(/\s+$/, "")}\n${key}=${value}\n`;
  fs.writeFileSync(envPath, next);
}

// Copies the freshly compiled VinCidRegistry ABI into the frontend. Shared by
// scripts/deploy.js (bootstrap) and scripts/upgrade.js (every upgrade may add
// new methods), so the frontend's ABI never drifts from whichever
// implementation the proxy currently points at.
export function syncFrontendAbi(rootDir) {
  const abiSrc = path.join(
    rootDir,
    "artifacts",
    "contracts",
    "car_nft_sc.sol",
    "VinCidRegistry.json"
  );
  if (!fs.existsSync(abiSrc)) {
    throw new Error(
      `Compiled artifact not found at ${abiSrc}. Run \`npm run compile\` first.`
    );
  }
  const abiDest = path.join(rootDir, "frontend", "src", "utils", "contract_abi.json");
  const { abi } = JSON.parse(fs.readFileSync(abiSrc, "utf8"));
  fs.writeFileSync(abiDest, JSON.stringify(abi, null, 2) + "\n");
  return abiDest;
}

// Writes/overwrites the dated, human-readable Sepolia deploy log under
// docs/deployments/ (per ADR 0006). `kind` is "bootstrap" (first-ever deploy:
// CarRewardToken + VinCidRegistry implementation + proxy) or "upgrade"
// (VinCidRegistry implementation only; proxy/registry address unchanged).
// Same-day re-runs overwrite that day's file — only the latest of any day is
// kept, matching the project's existing accepted behavior.
export function writeSepoliaDeployLog(rootDir, params) {
  const {
    kind,
    date,
    chainId,
    actor,
    timestamp,
    deployedAtBlock,
    registryAddress,
    implementationAddress,
    rewardTokenAddress,
  } = params;

  const etherscan = (addr) => `https://sepolia.etherscan.io/address/${addr}`;
  const logDir = path.join(rootDir, "docs", "deployments");
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `sepolia_contract_deploy_addresses_${date}.md`);

  const heading =
    kind === "upgrade" ? `Sepolia Contract Upgrade — ${date}` : `Sepolia Contract Deployment — ${date}`;
  const actorLabel = kind === "upgrade" ? "Upgrader" : "Deployer";

  const rows = [
    `| VinCidRegistry (proxy) | [\`${registryAddress}\`](${etherscan(registryAddress)}) |`,
    `| VinCidRegistry (implementation) | [\`${implementationAddress}\`](${etherscan(implementationAddress)}) |`,
  ];
  if (kind !== "upgrade") {
    rows.push(`| CarRewardToken | [\`${rewardTokenAddress}\`](${etherscan(rewardTokenAddress)}) |`);
  }

  const logBody = `# ${heading}

- **Network:** sepolia (chainId ${chainId})
- **${actorLabel}:** ${actor}
- **${kind === "upgrade" ? "Upgraded at" : "Deployed at"}:** ${timestamp}
- **Deployed at block (proxy):** ${deployedAtBlock}

## Contract Addresses

| Contract | Address (click for Etherscan) |
|----------|-------------------------------|
${rows.join("\n")}
`;

  fs.writeFileSync(logPath, logBody);
  return logPath;
}
