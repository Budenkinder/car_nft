import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  Container,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Divider,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  isValidWalletAddress,
  isValidTaxOrVatId,
  isValidRegistrationNumber,
} from "../utils/validation";
import {
  buildChallengeMessage,
  signChallenge,
  buildApplicationEmailBody,
  buildMailtoLink,
  buildExplorerTxLink,
  MAILTO_LENGTH_WARNING_THRESHOLD,
} from "../utils/org_application";
import { submitApplicationReceipt } from "../utils/pinata_ipfs_nft_service";
import { uiLog } from "../utils/logger";

const APPLICATION_EMAIL = process.env.REACT_APP_ORG_APPLICATION_EMAIL || "";

const initialFields = {
  legalName: "",
  registrationNumber: "",
  taxOrVatId: "",
  businessAddress: "",
};

// ADR 0035: the public application page. Collects the KYB application and a
// personal_sign proof of wallet control, then hands the whole thing off as a
// prefilled email — no backend, no upload, no storage anywhere in this
// system (decisions 2026-08-03-001, 2026-08-03-002). Approval itself happens
// outside this app entirely: the deployer runs scripts/manage-org-role.js.
export default function OrgRegistrationForm({ walletAddress, chainId, onBack }) {
  const [fields, setFields] = useState({ ...initialFields, walletAddress: walletAddress || "" });
  const [errors, setErrors] = useState({});
  const [challenge, setChallenge] = useState("");
  const [signature, setSignature] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  // The "Sign challenge" button sits near the bottom of the visible area, so
  // the Submit section (which only appears once both proofs — signature and
  // txHash — are set) renders entirely below the fold with no scroll — the
  // user sees the last status line and nothing else, and reports the submit
  // button as missing. Scroll it into view once it appears. Keyed on txHash
  // rather than signature: since ADR 0037, the Submit section only renders
  // once txHash is also set, so scrolling on signature alone would fire
  // before the section exists and do nothing.
  const submitSectionRef = useRef(null);
  useEffect(() => {
    if (txHash && submitSectionRef.current) {
      submitSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [txHash]);

  // The wallet field defaults to whatever is connected, but only at mount —
  // useState's initializer doesn't re-run. Without this, switching accounts
  // in MetaMask while this page is open leaves the field pointing at the
  // wallet that was connected when the page opened, and any signature/receipt
  // already collected would be over the wrong address.
  useEffect(() => {
    if (!walletAddress) return;
    setFields((prev) => ({ ...prev, walletAddress }));
    setSignature("");
    setChallenge("");
    setTxHash("");
  }, [walletAddress]);

  const setField = (name) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Any edit after signing invalidates the signature — it was signed over
    // a specific legal name/timestamp, and the wallet may also have changed.
    // The on-chain receipt is invalidated the same way: it's only meaningful
    // as a proof paired with a specific, still-current application.
    if (signature) {
      setSignature("");
      setChallenge("");
    }
    if (txHash) {
      setTxHash("");
    }
    setCopyStatus("");
    setErrors((prev) => (prev.general ? { ...prev, general: undefined } : prev));
  };

  const validate = () => {
    const newErrors = {};
    if (!fields.legalName.trim()) newErrors.legalName = "Legal name is required";
    if (!isValidRegistrationNumber(fields.registrationNumber))
      newErrors.registrationNumber = "Registration number is required";
    if (!isValidTaxOrVatId(fields.taxOrVatId)) newErrors.taxOrVatId = "Tax/VAT ID is required";
    if (!fields.businessAddress.trim())
      newErrors.businessAddress = "Business address is required";

    if (!isValidWalletAddress(fields.walletAddress))
      newErrors.walletAddress = "A valid wallet address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSign = async () => {
    if (!validate()) return;
    if (!walletAddress) {
      setErrors((prev) => ({ ...prev, general: "Connect your wallet before signing." }));
      return;
    }
    if (fields.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      setErrors((prev) => ({
        ...prev,
        walletAddress: "This must match your connected wallet — switch MetaMask or edit the field.",
      }));
      return;
    }

    setIsSigning(true);
    setErrors((prev) => ({ ...prev, general: undefined }));
    try {
      const message = buildChallengeMessage(fields.legalName.trim());
      const sig = await signChallenge(message, walletAddress);
      if (!isMountedRef.current) return;
      setChallenge(message);
      setSignature(sig);
      uiLog.info("orgRegistration:signed", { walletAddress });
    } catch (error) {
      uiLog.warn("orgRegistration:sign_failed", { message: error.message });
      if (!isMountedRef.current) return;
      setErrors((prev) => ({
        ...prev,
        general:
          error.code === 4001
            ? "Signature request was rejected. Signing proves you control this wallet — required before submitting."
            : `Failed to sign: ${error.message}`,
      }));
    } finally {
      if (isMountedRef.current) setIsSigning(false);
    }
  };

  // ADR 0037: a second, distinct proof — a real mined transaction — required
  // before the email step unlocks. Kept as its own explicit button (rather
  // than firing automatically right after signing) so the applicant isn't
  // surprised by a second wallet prompt, and understands this one costs gas
  // unlike the free signature above.
  const handleSubmitReceipt = async () => {
    if (!walletAddress) {
      setErrors((prev) => ({ ...prev, general: "Connect your wallet before submitting." }));
      return;
    }
    setIsSubmittingTx(true);
    setErrors((prev) => ({ ...prev, general: undefined }));
    try {
      const { txHash: hash } = await submitApplicationReceipt(walletAddress, chainId);
      if (!isMountedRef.current) return;
      setTxHash(hash);
      uiLog.info("orgRegistration:receiptSubmitted", { walletAddress, chainId, txHash: hash });
    } catch (error) {
      uiLog.warn("orgRegistration:receipt_failed", { message: error.message });
      if (!isMountedRef.current) return;
      setErrors((prev) => ({
        ...prev,
        general:
          error.code === 4001
            ? "Transaction was rejected. A mined transaction is required as proof this wallet can actually transact on this network."
            : /insufficient funds/i.test(error.message || "")
            ? "This wallet doesn't have enough network gas to send the transaction — fund it with a small amount of ETH and try again."
            : `Failed to submit on-chain receipt: ${error.message}`,
      }));
    } finally {
      if (isMountedRef.current) setIsSubmittingTx(false);
    }
  };

  const emailBody = signature && txHash
    ? buildApplicationEmailBody(
        {
          legalName: fields.legalName.trim(),
          registrationNumber: fields.registrationNumber.trim(),
          taxOrVatId: fields.taxOrVatId.trim(),
          businessAddress: fields.businessAddress.trim(),
          walletAddress: fields.walletAddress.trim(),
        },
        challenge,
        signature,
        txHash
      )
    : "";
  const bodyIsLong = emailBody.length > MAILTO_LENGTH_WARNING_THRESHOLD;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopyStatus("Copied to clipboard.");
    } catch {
      setCopyStatus("Could not copy automatically — select and copy the text below manually.");
    }
  };

  const mailtoHref = APPLICATION_EMAIL
    ? buildMailtoLink(
        APPLICATION_EMAIL,
        `car_nft organization application — ${fields.legalName}`,
        emailBody
      )
    : "";

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5">Register Your Organization</Typography>
          <Button onClick={onBack}>Back</Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Approval is manual and can take several days. Signing the challenge below only proves
          you control the wallet you're registering — it is not the approval itself. No documents
          are uploaded here: attach them to the email this page prepares for you.
        </Typography>

        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              1. Organization Identity
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Legal name"
                fullWidth
                value={fields.legalName}
                onChange={setField("legalName")}
                error={!!errors.legalName}
                helperText={errors.legalName}
              />
              <TextField
                label="Registration number"
                fullWidth
                value={fields.registrationNumber}
                onChange={setField("registrationNumber")}
                error={!!errors.registrationNumber}
                helperText={errors.registrationNumber}
              />
              <TextField
                label="Tax / VAT ID"
                fullWidth
                value={fields.taxOrVatId}
                onChange={setField("taxOrVatId")}
                error={!!errors.taxOrVatId}
                helperText={errors.taxOrVatId}
              />
              <TextField
                label="Business address"
                fullWidth
                multiline
                value={fields.businessAddress}
                onChange={setField("businessAddress")}
                error={!!errors.businessAddress}
                helperText={errors.businessAddress}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              2. Wallet
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Wallet address to register"
                fullWidth
                value={fields.walletAddress}
                onChange={setField("walletAddress")}
                error={!!errors.walletAddress}
                helperText={
                  errors.walletAddress ||
                  "Must match your connected MetaMask wallet — this is what receives ORG_ROLE"
                }
              />
              <Button
                variant="outlined"
                onClick={handleSign}
                disabled={isSigning}
                startIcon={isSigning ? <CircularProgress size={20} /> : null}
              >
                {isSigning ? "Signing..." : "Sign challenge with MetaMask"}
              </Button>
              {signature && (
                <Typography variant="body2" color="success.main">
                  Signed. This proves wallet control only — a human reviewer still verifies the
                  application before approval.
                </Typography>
              )}
            </Stack>
          </Box>

          {signature && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  3. On-chain Receipt
                </Typography>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    This is a real transaction and costs a small amount of network gas — unlike
                    the free signature above, it proves this wallet can actually transact on this
                    network. Its transaction hash is included in your application email.
                  </Typography>
                  {!txHash && (
                    <Button
                      variant="outlined"
                      onClick={handleSubmitReceipt}
                      disabled={isSubmittingTx}
                      startIcon={isSubmittingTx ? <CircularProgress size={20} /> : null}
                    >
                      {isSubmittingTx ? "Submitting..." : "Submit on-chain receipt"}
                    </Button>
                  )}
                  {txHash && (
                    <Typography variant="body2" color="success.main">
                      On-chain receipt confirmed:{" "}
                      <a href={buildExplorerTxLink(txHash)} target="_blank" rel="noreferrer">
                        {txHash}
                      </a>
                    </Typography>
                  )}
                </Stack>
              </Box>
            </>
          )}

          {errors.general && (
            <Typography color="error">{errors.general}</Typography>
          )}

          {signature && txHash && (
            <Box ref={submitSectionRef}>
              <Typography variant="subtitle1" gutterBottom>
                Submit
              </Typography>
              {!APPLICATION_EMAIL && (
                <Typography color="error" sx={{ mb: 1 }}>
                  No application email is configured (REACT_APP_ORG_APPLICATION_EMAIL) — use the
                  copy button below and send it manually.
                </Typography>
              )}
              {bodyIsLong && (
                <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                  This application is long and may be truncated by your mail client's mailto:
                  handling. Use "Copy application text" and paste it into your email manually if
                  the prefilled email looks cut off.
                </Typography>
              )}
              <Stack direction="row" spacing={2}>
                {mailtoHref && (
                  <Button variant="contained" href={mailtoHref}>
                    Open email to submit
                  </Button>
                )}
                <Button variant="outlined" onClick={handleCopy}>
                  Copy application text
                </Button>
              </Stack>
              {copyStatus && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {copyStatus}
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

OrgRegistrationForm.propTypes = {
  walletAddress: PropTypes.string,
  chainId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onBack: PropTypes.func.isRequired,
};
