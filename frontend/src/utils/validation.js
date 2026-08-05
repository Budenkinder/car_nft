export const cidRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-zA-Z2-7]{58,})$/;

export const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

export const isValidCID = (cid) => {
  if (!cid || typeof cid !== "string") return false;
  return cidRegex.test(cid);
};

export const isValidVIN = (vin) => {
  if (!vin || typeof vin !== "string") return false;
  return vinRegex.test(vin.toUpperCase());
};

// ADR 0035 org application validators. Kept permissive on format —
// registration numbers, tax/VAT IDs, and similar identifiers vary widely
// across European jurisdictions, so these check for "present and not an
// obvious typo," not authoritative validation. The wallet address check is
// the exception: it must be strict, since that's what gets granted ORG_ROLE.

export const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const isValidWalletAddress = (address) => {
  if (!address || typeof address !== "string") return false;
  return walletAddressRegex.test(address);
};

// Deliberately permissive: accepts common patterns across EU VAT numbers
// (e.g. "DE123456789") and free-form tax IDs, just requiring letters/digits/
// spaces/hyphens and a plausible minimum length.
export const isValidTaxOrVatId = (value) => {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= 4 && /^[A-Za-z0-9\s-]+$/.test(trimmed);
};

export const isValidRegistrationNumber = (value) => {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= 3 && /^[A-Za-z0-9\s/-]+$/.test(trimmed);
};

export const validateCarData = (carData) => {
  const errors = {};

  if (!carData) {
    return { isValid: false, errors: { general: "Car data is required" } };
  }

  if (!isValidVIN(carData.vinNumber)) {
    errors.vinNumber = "Invalid VIN format";
  }

  if (!carData.carBrand?.trim()) {
    errors.brand = "Brand is required";
  }

  if (!carData.carModel?.trim()) {
    errors.model = "Model is required";
  }

  const year = parseInt(carData.carYear);
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    errors.year = "Invalid year";
  }

  const mileage = parseInt(carData.mileage);
  if (isNaN(mileage) || mileage < 0) {
    errors.mileage = "Invalid mileage";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
