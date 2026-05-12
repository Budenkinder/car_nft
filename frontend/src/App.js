import React, { useState, useCallback } from "react";
import {
  getCidFromContract,
  handleNFTCreation,
  fetchNFTMetadata,
} from "./utils/pinata_ipfs_nft_service";
import { isValidVIN, validateCarData } from "./utils/validation";

import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  Box,
  Paper,
  Stack,
  CircularProgress,
} from "@mui/material";
import MetaMaskLogin from "./components/MetaMaskLogin";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6750A4",
    },
    secondary: {
      main: "#625B71",
    },
    background: {
      default: "#FFFBFE",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    h6: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [chainId, setChainId] = useState("");
  const [vin, setVin] = useState("");
  const [createVin, setCreateVin] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [issue, setIssue] = useState("");
  const [shop, setShop] = useState("");
  const [mileage, setMileage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const [vinLastCid, setVinLastCid] = useState("");

  const callbackMetaMaskLogin = useCallback((address, newChainId) => {
    setWalletAddress(address);
    setChainId(newChainId);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const carData = {
      vinNumber: createVin,
      carBrand: brand,
      carModel: model,
      carYear: year,
      issueDescription: issue,
      repairShop: shop,
      mileage: mileage,
    };

    let newErrors = {};

    if (!createVin) newErrors.vinNumber = "VIN number is required";
    if (!brand) newErrors.brand = "Brand is required";
    if (!model) newErrors.model = "Model is required";
    if (!year) newErrors.year = "Year is required";
    if (!issue) newErrors.issue = "Issue description is required";
    if (!shop) newErrors.shop = "Repair shop is required";
    if (!mileage) newErrors.mileage = "Mileage is required";

    const validation = validateCarData(carData);
    if (!validation.isValid) {
      newErrors = { ...newErrors, ...validation.errors };
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = await handleNFTCreation(carData, chainId);

    if (result.success) {
      setTxHash(result.txHash);
    } else {
      setErrors({ general: result.message });
    }

    setIsSubmitting(false);
  };

  const handleLoadNFT = async () => {
    if (vin.length === 0) {
      setErrors({ ...errors, vin: "VIN is required to load NFT data" });
      return;
    }

    if (!isValidVIN(vin)) {
      setErrors({ ...errors, vin: "Invalid VIN format" });
      return;
    }

    setErrors({ ...errors, vin: undefined });
    setIsLoadingNFT(true);

    try {
      const cid = await getCidFromContract(vin);
      setVinLastCid(cid || "");

      if (cid) {
        const metadata = await fetchNFTMetadata(cid);
        if (metadata.success) {
          setCreateVin(metadata.data.vin || vin);
          setBrand(metadata.data.make || "");
          setModel(metadata.data.model || "");
          setYear(metadata.data.year || "");
          setMileage(metadata.data.mileage || "");
          setIssue(metadata.data.issueDescription || "");
          setShop(metadata.data.repairShop || "");
        }
      }
    } catch (error) {
      console.error("Error loading NFT data:", error);
      setErrors({ ...errors, vin: "Failed to load NFT data for this VIN" });
    } finally {
      setIsLoadingNFT(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Car Repair NFT
          </Typography>
          <MetaMaskLogin
            onConnect={callbackMetaMaskLogin}
            buttonText="Connect Wallet"
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Search via Smart Contract for the VIN NFT: WBADT33383G473829
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="VIN Search"
              fullWidth
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              error={!!errors.vin}
              helperText={
                errors.vin || "Vehicle Identification Number (17 characters)"
              }
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleLoadNFT}
              disabled={isLoadingNFT || walletAddress.length === 0}
              startIcon={
                isLoadingNFT ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isLoadingNFT ? "Loading..." : "Load Car NFT"}
            </Button>
          </Stack>
          {vinLastCid && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loaded CID: {vinLastCid}
            </Typography>
          )}
        </Paper>
      </Container>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Create or Update CAR NFT
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="VIN"
              fullWidth
              value={createVin}
              onChange={(e) => setCreateVin(e.target.value)}
              error={!!errors.vinNumber}
              helperText={
                errors.vinNumber ||
                "Vehicle Identification Number (17 characters)"
              }
            />
            <TextField
              label="Brand"
              fullWidth
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              error={!!errors.brand}
              helperText={errors.brand}
            />
            <TextField
              label="Model"
              fullWidth
              value={model}
              onChange={(e) => setModel(e.target.value)}
              error={!!errors.model}
              helperText={errors.model}
            />
            <TextField
              label="Year"
              fullWidth
              value={year}
              onChange={(e) => setYear(e.target.value)}
              error={!!errors.year}
              helperText={errors.year}
            />
            <TextField
              label="Issue Fixed"
              fullWidth
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              error={!!errors.issue}
              helperText={errors.issue}
            />
            <TextField
              label="Repair Shop"
              fullWidth
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              error={!!errors.shop}
              helperText={errors.shop}
            />
            <TextField
              label="Mileage in Km"
              fullWidth
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              error={!!errors.mileage}
              helperText={errors.mileage}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={walletAddress.length === 0 || isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isSubmitting ? "Processing..." : "Submit Repair"}
            </Button>
          </Stack>

          {errors.general && (
            <Typography color="error" sx={{ mt: 2 }}>
              {errors.general}
            </Typography>
          )}

          {txHash && (
            <Box mt={2}>
              <Typography variant="body2">
                Transaction sent:{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {txHash}
                </a>
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
