import Web3 from "web3";
import { walletLog } from "./logger";

// Builds the personal_sign challenge string proving control of the wallet
// being registered. Verified by a human reviewer off-chain (e.g. via
// web3.eth.personal.ecRecover or Etherscan's signature verifier) — the
// contract never checks this signature; it only checks ORG_ROLE once the
// deployer grants it (see scripts/manage-org-role.js).
export const buildChallengeMessage = (legalName) => {
  const timestamp = new Date().toISOString();
  return `I confirm control of this wallet for car_nft registration — ${legalName} — ${timestamp}`;
};

export const signChallenge = async (message, walletAddress) => {
  walletLog.info("orgApplication:signChallenge:start", { walletAddress });
  const web3 = new Web3(window.ethereum);
  try {
    const signature = await web3.eth.personal.sign(message, walletAddress, "");
    walletLog.info("orgApplication:signChallenge:done", { walletAddress });
    return signature;
  } catch (error) {
    walletLog.warn("orgApplication:signChallenge:failed", {
      walletAddress,
      code: error.code,
      message: error.message,
    });
    throw error;
  }
};

// `mailto:` bodies truncate at varying, undocumented lengths across mail
// clients (commonly cited around ~2,000 characters) — this is a heuristic
// warning threshold, not a guarantee. Task 7 requires a real-browser check;
// this constant exists so the UI can proactively offer the copy-to-clipboard
// fallback rather than let an applicant discover truncation after the fact.
export const MAILTO_LENGTH_WARNING_THRESHOLD = 2000;

// ADR 0037: matches the existing (hardcoded-to-Sepolia) block-explorer link
// convention already used in App.js — this app has no other network-aware
// explorer helper, so this stays consistent with that rather than inventing
// a new pattern for a single call site.
export const buildExplorerTxLink = (txHash) => `https://sepolia.etherscan.io/tx/${txHash}`;

export const buildApplicationEmailBody = (fields, challenge, signature, txHash) => {
  const lines = [
    "ORGANIZATION APPLICATION — car_nft ORG_ROLE registration",
    "",
    "== 1. Organization Identity ==",
    `Legal name: ${fields.legalName}`,
    `Registration number: ${fields.registrationNumber}`,
    `Tax/VAT ID: ${fields.taxOrVatId}`,
    `Business address: ${fields.businessAddress}`,
    "",
    "== 2. Wallet ==",
    `Address: ${fields.walletAddress}`,
    `Signed challenge: ${challenge}`,
    `Signature: ${signature}`,
    "",
    "== 3. On-chain Receipt ==",
    `Transaction hash: ${txHash}`,
    `View on block explorer: ${buildExplorerTxLink(txHash)}`,
    "",
    "== Documents to attach to this email ==",
    "- Craftsman certificate / trade qualification proof",
    "- Chamber of commerce / business registration extract",
    "- Insurance policy certificate",
  ];
  return lines.join("\n");
};

export const buildMailtoLink = (recipient, subject, body) => {
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body
  )}`;
};
