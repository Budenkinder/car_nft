/**
 * Regular expression for validating IPFS CID format
 */
export const cidRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;

/**
 * Regular expression for validating VIN format
 * - Must be 17 characters
 * - Allowed characters: 0-9 and A-Z (except I, O, Q)
 */
export const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Validates IPFS CID format
 * @param {string} cid - The CID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidCID = (cid) => {
  if (!cid || typeof cid !== "string") return false;
  return cidRegex.test(cid);
};

/**
 * Validates VIN format
 * @param {string} vin - The VIN to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidVIN = (vin) => {
  if (!vin || typeof vin !== "string") return false;
  return vinRegex.test(vin.toUpperCase());
};

/**
 * Validates car data object
 * @param {Object} carData - The car data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateCarData = (carData) => {
  const errors = [];

  if (!carData) {
    return { isValid: false, errors: ["Car data is required"] };
  }

  console.log(carData.vin);

  if (!isValidVIN(carData.vin)) {
    errors.push("Invalid VIN format");
  }

  if (!carData.brand?.trim()) {
    errors.push("Brand is required");
  }

  console.log(carData.brand);

  if (!carData.model?.trim()) {
    errors.push("Model is required");
  }

  console.log(carData.model);

  const year = parseInt(carData.year);
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    errors.push("Invalid year");
  }

  console.log(carData.year);

  const mileage = parseInt(carData.mileage);
  if (isNaN(mileage) || mileage < 0) {
    errors.push("Invalid mileage");
  }

  console.log(carData.mileage);

  return {
    isValid: errors.length === 0,
    errors,
  };
};
