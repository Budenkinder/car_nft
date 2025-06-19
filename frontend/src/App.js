import React, { useState, useEffect } from "react";
import {
  getCidFromContract,
  handleNFTCreation,
} from "./utils/pinata_ipfs_nft_service";
import { isValidVIN, validateCarData } from "./utils/validation";
import Web3 from "web3";
import { fetchNFTMetadata } from "./utils/pinata_ipfs_nft_service";

const CONTRACT_ABI = [];

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

  const callbackMetaMaskLogin = (address, chainId) => {
    setWalletAddress(address);
    setChainId(chainId);
    console.log("callback Connected to chain:", chainId);
    console.log("callback contract address: ", address);
  };

  // creates the IPFS Hash - called NFT
  const handleSubmit = async (event) => {
    console.log("starting handleSubmi");
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

    // Reset errors
    let newErrors = {};

    // Validate all required fields
    if (!createVin) newErrors.vinNumber = "VINnumber is required";
    if (!brand) newErrors.brand = "Brand is required";
    if (!model) newErrors.model = "Model is required";
    if (!year) newErrors.year = "Year is required";
    if (!issue) newErrors.issue = "Issue description is required";
    if (!shop) newErrors.shop = "Repair shop is required";
    if (!mileage) newErrors.mileage = "Mileage is required";

    // Validate all car data
    console.log("carData: ", carData);
    const validation = validateCarData(carData);

    console.log("validation: ", validation);
    const isValid = validation.isValid;

    if (!isValid) {
      newErrors = { ...newErrors, ...validation.errors };
    }

    console.log("newErrors: ", newErrors);

    // If there are errors, don't proceed
    if (Object.keys(newErrors).length > 0) {
      // Update error state
      setErrors(newErrors);
      return;
    }

    // Show loading state
    setIsSubmitting(true);

    console.log("handleNFTCreation");
    const result = await handleNFTCreation(carData, chainId);

    if (result.success) {
      // Handle success - maybe show a success message
      console.log(`IPFS Hash: ${result.ipfsHash}`);
    } else {
      // Handle error
      console.error(result.message);
    }

    // Simulate blockchain transaction
    setTimeout(() => {
      const mockTxHash =
        "0x" +
        Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");
      setTxHash(mockTxHash);
      setIsSubmitting(false);

      console.log("Submitting repair record:", {
        vin,
        brand,
        model,
        year,
        issue,
        shop,
        mileage,
        txHash: mockTxHash,
      });
    }, 2000);
  };

  const handleLoadNFT = async () => {
    console.log("vin: ", vin);
    if (vin.length == 0) {
      setErrors({ ...errors, vin: "VIN is required to load NFT data" });
      return;
    }
    console.log("vin valid?", isValidVIN(vin));

    if (!isValidVIN(vin)) {
      newErrors = { ...newErrors, ...validation.errors };
    }

    setIsLoadingNFT(true);

    try {
      const cid = await getCidFromContract(
        vin,
        `${process.env.REACT_APP_SMART_CONTRACT_ADDRESS}`,
        CONTRACT_ABI
      );

      setVinLastCid(cid);
      console.log("CID from contract:", cid);

      if (cid) {
        const metadata = await fetchNFTMetadata(cid);
        if (metadata.success) {
          // Populate form with metadata
          setBrand(metadata.data.make || "");
          setModel(metadata.data.model || "");
          setYear(metadata.data.year || "");
          setMileage(metadata.data.mileage || "");
        }
      }
    } catch (error) {
      console.error("Error loading NFT data:", error);
      setErrors({ ...errors, vin: "Failed to load NFT data for this VIN" });
      setIsLoadingNFT(false);
    } finally {
      setIsLoadingNFT(false);
    }
  };

  // UI

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
            Search for the VIN NFT: WBADT43483G473829
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
              disabled={
                !isLoadingNFT || walletAddress.length == 0 ? false : true
              }
              startIcon={
                isLoadingNFT ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isLoadingNFT ? "Loading..." : "Load Car NFT"}
            </Button>
          </Stack>
        </Paper>
      </Container>

      <Container
        maxWidth="sm"
        sx={{ mt: 4 }}
        disabled={!vinLastCid.length == 0 ? true : false}
      >
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Create or Update CAR NFT
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="VIN"
              fullWidth
              onChange={(e) => setCreateVin(e.target.value)}
              //error={!!errors.vin}
              helperText={"Vehicle Identification Number (17 characters)"}
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
              onClick={(e) => handleSubmit(e)}
              disabled={
                walletAddress.length == 0 ? true : false || isSubmitting
              }
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isSubmitting ? "Processing..." : "Submit Repair"}
            </Button>
          </Stack>

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
