import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

const testingDir = path.join(repoRoot, "docs", "testing");
fs.mkdirSync(testingDir, { recursive: true });

const logPath = path.join(testingDir, "test-output.log");
const gasStatsPath = path.join(testingDir, "gas-report.json");
const reportPath = path.join(testingDir, "automated-test-report.md");

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

// Mocha's json reporter prints a pretty-printed JSON object (top-level `{`
// and `}` each on their own line) interleaved with Hardhat's own console
// output before/after it. Extract just that object rather than assuming the
// whole stream is JSON.
function extractJson(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.trim() === "{");
  let end = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "}") {
      end = i;
      break;
    }
  }
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(lines.slice(start, end + 1).join("\n"));
  } catch {
    return null;
  }
}

function renderGasSection(gasData) {
  if (!gasData || !gasData.contracts) {
    return "_No gas data available (the test run may have failed before any contract calls executed)._\n";
  }
  const entries = Object.entries(gasData.contracts);
  if (entries.length === 0) return "_No contracts reported gas usage._\n";

  let out = "";
  for (const [key, contract] of entries) {
    out += `### ${contract.contractName} (\`${contract.sourceName}\`)\n\n`;
    const d = contract.deployment;
    out += `**Deployment:** avg ${fmt(d.avg)} gas (min ${fmt(d.min)} / max ${fmt(d.max)}), runtime size ${fmt(d.runtimeSize)} bytes, n=${d.count}\n\n`;

    const fns = Object.entries(contract.functions || {});
    if (fns.length > 0) {
      out += "| Function | Avg gas | Min | Max | Calls |\n|---|---|---|---|---|\n";
      for (const [fnName, stats] of fns) {
        out += `| \`${fnName}\` | ${fmt(stats.avg)} | ${fmt(stats.min)} | ${fmt(stats.max)} | ${stats.count} |\n`;
      }
      out += "\n";
    }
  }
  return out;
}

function renderTestList(tests) {
  const bySuite = new Map();
  for (const t of tests) {
    const suite = t.fullTitle.slice(0, t.fullTitle.length - t.title.length).trim();
    if (!bySuite.has(suite)) bySuite.set(suite, []);
    bySuite.get(suite).push(t);
  }
  let out = "";
  for (const [suite, list] of bySuite) {
    out += `- **${suite || "(root)"}**\n`;
    for (const t of list) {
      const mark = t.err && t.err.message ? "✗" : "✓";
      out += `  - ${mark} ${t.title} (${t.duration}ms)\n`;
    }
  }
  return out;
}

function renderFailures(failures) {
  if (!failures || failures.length === 0) return "";
  let out = "## Failures\n\n";
  for (const f of failures) {
    out += `### ${f.fullTitle}\n\n\`\`\`\n${f.err.message || "(no message)"}\n\`\`\`\n\n`;
  }
  return out;
}

async function main() {
  const logStream = fs.createWriteStream(logPath);
  let combined = "";

  const child = spawn(
    "npx",
    ["hardhat", "test", "--gas-stats-json", gasStatsPath],
    {
      cwd: repoRoot,
      env: { ...process.env, MOCHA_REPORTER: "json" },
    }
  );

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    logStream.write(chunk);
    combined += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
    logStream.write(chunk);
    combined += chunk.toString();
  });

  const exitCode = await new Promise((resolve) => {
    child.on("close", resolve);
  });
  logStream.end();

  const results = extractJson(combined);
  const gasData = fs.existsSync(gasStatsPath)
    ? JSON.parse(fs.readFileSync(gasStatsPath, "utf8"))
    : null;

  const runDate = new Date().toISOString();
  let md = `# Automated Hardhat Test Report\n\n`;
  md += `Generated ${runDate} by \`npm run test:report\`. Regenerate after changing \`test/\` or the contracts under test — this file is committed so test coverage and gas costs are visible without running anything.\n\n`;

  if (!results) {
    md += `_Could not parse test results from the run output. See the raw log at \`docs/testing/test-output.log\` (gitignored, local only) or re-run \`npm run test:report\`._\n\n`;
  } else {
    const { stats, tests, failures } = results;
    md += `## Summary\n\n`;
    md += `**${stats.passes} passing / ${stats.failures} failing** out of ${stats.tests} tests (${stats.duration}ms)\n\n`;
    md += renderFailures(failures);
    md += `## Tests\n\n`;
    md += renderTestList(tests);
    md += `\n`;
  }

  md += `## Gas Usage\n\n`;
  md += renderGasSection(gasData);

  fs.writeFileSync(reportPath, md);
  console.log(`\nWrote ${reportPath}`);

  process.exitCode = exitCode;
}

main();
