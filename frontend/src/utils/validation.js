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
