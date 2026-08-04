import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Container,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Divider,
  Checkbox,
  FormControlLabel,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  isValidWalletAddress,
  isValidTaxOrVatId,
  isValidRegistrationNumber,
  isValidEmail,
  isValidExpiryDate,
} from "../utils/validation";
import {
  buildChallengeMessage,
  signChallenge,
  buildApplicationEmailBody,
  buildMailtoLink,
  MAILTO_LENGTH_WARNING_THRESHOLD,
} from "../utils/org_application";
import { uiLog } from "../utils/logger";

const APPLICATION_EMAIL = process.env.REACT_APP_ORG_APPLICATION_EMAIL || "";

const initialFields = {
  legalName: "",
  registrationNumber: "",
  taxOrVatId: "",
  businessAddress: "",
  foundedDate: "",
  craftsmanCertificate: "",
  chamberMembershipNumber: "",
  specialization: "",
  insuranceProvider: "",
  policyNumber: "",
  coverageExpiry: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  references: "",
  accuracyConfirmed: false,
  fraudBanAcknowledged: false,
  declarationName: "",
  declarationDate: "",
};

// ADR 0035: the public application page. Collects the KYB application and a
// personal_sign proof of wallet control, then hands the whole thing off as a
// prefilled email — no backend, no upload, no storage anywhere in this
// system (decisions 2026-08-03-001, 2026-08-03-002). Approval itself happens
// outside this app entirely: the deployer runs scripts/manage-org-role.js.
export default function OrgRegistrationForm({ walletAddress, onBack }) {
  const [fields, setFields] = useState({ ...initialFields, walletAddress: walletAddress || "" });
  const [errors, setErrors] = useState({});
  const [challenge, setChallenge] = useState("");
  const [signature, setSignature] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const setField = (name) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Any edit after signing invalidates the signature — it was signed over
    // a specific legal name/timestamp, and the wallet may also have changed.
    if (signature) {
      setSignature("");
      setChallenge("");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!fields.legalName.trim()) newErrors.legalName = "Legal name is required";
    if (!isValidRegistrationNumber(fields.registrationNumber))
      newErrors.registrationNumber = "Registration number is required";
    if (!isValidTaxOrVatId(fields.taxOrVatId)) newErrors.taxOrVatId = "Tax/VAT ID is required";
    if (!fields.businessAddress.trim())
      newErrors.businessAddress = "Business address is required";
    if (!fields.foundedDate) newErrors.foundedDate = "Founded date is required";

    if (!fields.craftsmanCertificate.trim())
      newErrors.craftsmanCertificate = "Craftsman certificate reference is required";
    if (!fields.chamberMembershipNumber.trim())
      newErrors.chamberMembershipNumber = "Chamber membership number is required";
    if (!fields.specialization.trim())
      newErrors.specialization = "Specialization is required";

    if (!fields.insuranceProvider.trim())
      newErrors.insuranceProvider = "Insurance provider is required";
    if (!fields.policyNumber.trim()) newErrors.policyNumber = "Policy number is required";
    if (!isValidExpiryDate(fields.coverageExpiry))
      newErrors.coverageExpiry = "Coverage expiry date is required";

    if (!fields.contactName.trim()) newErrors.contactName = "Contact name is required";
    if (!fields.contactRole.trim()) newErrors.contactRole = "Contact role is required";
    if (!isValidEmail(fields.contactEmail))
      newErrors.contactEmail = "A valid business email is required";
    if (!fields.contactPhone.trim()) newErrors.contactPhone = "Contact phone is required";

    if (!isValidWalletAddress(fields.walletAddress))
      newErrors.walletAddress = "A valid wallet address is required";

    if (!fields.accuracyConfirmed)
      newErrors.accuracyConfirmed = "You must confirm the information is accurate";
    if (!fields.fraudBanAcknowledged)
      newErrors.fraudBanAcknowledged = "You must acknowledge the fraud-ban policy";
    if (!fields.declarationName.trim())
      newErrors.declarationName = "Typed name is required";
    if (!fields.declarationDate) newErrors.declarationDate = "Declaration date is required";

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
      const message = buildChallengeMessage(fields.legalName);
      const sig = await signChallenge(message, walletAddress);
      setChallenge(message);
      setSignature(sig);
      uiLog.info("orgRegistration:signed", { walletAddress });
    } catch (error) {
      uiLog.warn("orgRegistration:sign_failed", { message: error.message });
      setErrors((prev) => ({
        ...prev,
        general:
          error.code === 4001
            ? "Signature request was rejected. Signing proves you control this wallet — required before submitting."
            : `Failed to sign: ${error.message}`,
      }));
    } finally {
      setIsSigning(false);
    }
  };

  const emailBody = signature
    ? buildApplicationEmailBody(fields, challenge, signature)
    : "";
  const bodyIsLong = emailBody.length > MAILTO_LENGTH_WARNING_THRESHOLD;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopyStatus("Copied to clipboard.");
    } catch (error) {
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
              <TextField
                label="Founded date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={fields.foundedDate}
                onChange={setField("foundedDate")}
                error={!!errors.foundedDate}
                helperText={errors.foundedDate}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              2. Trade Qualification
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Craftsman certificate (reference / number)"
                fullWidth
                value={fields.craftsmanCertificate}
                onChange={setField("craftsmanCertificate")}
                error={!!errors.craftsmanCertificate}
                helperText={
                  errors.craftsmanCertificate || "Attach a copy of the certificate to the email"
                }
              />
              <TextField
                label="Chamber membership number"
                fullWidth
                value={fields.chamberMembershipNumber}
                onChange={setField("chamberMembershipNumber")}
                error={!!errors.chamberMembershipNumber}
                helperText={errors.chamberMembershipNumber}
              />
              <TextField
                label="Specialization"
                fullWidth
                value={fields.specialization}
                onChange={setField("specialization")}
                error={!!errors.specialization}
                helperText={errors.specialization}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              3. Insurance
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Provider"
                fullWidth
                value={fields.insuranceProvider}
                onChange={setField("insuranceProvider")}
                error={!!errors.insuranceProvider}
                helperText={errors.insuranceProvider}
              />
              <TextField
                label="Policy number"
                fullWidth
                value={fields.policyNumber}
                onChange={setField("policyNumber")}
                error={!!errors.policyNumber}
                helperText={
                  errors.policyNumber || "Attach a copy of the policy certificate to the email"
                }
              />
              <TextField
                label="Coverage expiry"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={fields.coverageExpiry}
                onChange={setField("coverageExpiry")}
                error={!!errors.coverageExpiry}
                helperText={errors.coverageExpiry}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              4. Contact Person
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Name"
                fullWidth
                value={fields.contactName}
                onChange={setField("contactName")}
                error={!!errors.contactName}
                helperText={errors.contactName}
              />
              <TextField
                label="Role"
                fullWidth
                value={fields.contactRole}
                onChange={setField("contactRole")}
                error={!!errors.contactRole}
                helperText={errors.contactRole}
              />
              <TextField
                label="Business email"
                fullWidth
                value={fields.contactEmail}
                onChange={setField("contactEmail")}
                error={!!errors.contactEmail}
                helperText={errors.contactEmail}
              />
              <TextField
                label="Phone"
                fullWidth
                value={fields.contactPhone}
                onChange={setField("contactPhone")}
                error={!!errors.contactPhone}
                helperText={errors.contactPhone}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              5. Wallet
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

          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              6. Supporting Evidence
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Website (optional)"
                fullWidth
                value={fields.website}
                onChange={setField("website")}
              />
              <TextField
                label="References (optional, free text)"
                fullWidth
                multiline
                value={fields.references}
                onChange={setField("references")}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              7. Declarations
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fields.accuracyConfirmed}
                    onChange={setField("accuracyConfirmed")}
                  />
                }
                label="I confirm the information provided is accurate"
              />
              {errors.accuracyConfirmed && (
                <Typography variant="caption" color="error">
                  {errors.accuracyConfirmed}
                </Typography>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fields.fraudBanAcknowledged}
                    onChange={setField("fraudBanAcknowledged")}
                  />
                }
                label="I acknowledge that fraudulent applications result in a permanent ban"
              />
              {errors.fraudBanAcknowledged && (
                <Typography variant="caption" color="error">
                  {errors.fraudBanAcknowledged}
                </Typography>
              )}
              <TextField
                label="Typed name"
                fullWidth
                value={fields.declarationName}
                onChange={setField("declarationName")}
                error={!!errors.declarationName}
                helperText={errors.declarationName}
              />
              <TextField
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={fields.declarationDate}
                onChange={setField("declarationDate")}
                error={!!errors.declarationDate}
                helperText={errors.declarationDate}
              />
            </Stack>
          </Box>

          {errors.general && (
            <Typography color="error">{errors.general}</Typography>
          )}

          {signature && (
            <Box>
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
  onBack: PropTypes.func.isRequired,
};
