import React, { useState } from "react";
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
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [issue, setIssue] = useState("");
  const [shop, setShop] = useState("");
  const [txHash, setTxHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnect = (address, chainId) => {
    setWalletAddress(address);
    console.log("Connected to chain:", chainId);
  };

  const handleSubmit = () => {
    // Reset errors
    const newErrors = {};

    // Validate all required fields
    if (!vin) newErrors.vin = "VIN is required";
    if (!make) newErrors.make = "Make is required";
    if (!model) newErrors.model = "Model is required";
    if (!year) newErrors.year = "Year is required";
    if (!issue) newErrors.issue = "Issue description is required";
    if (!shop) newErrors.shop = "Repair shop is required";

    // Check if vin is a valid VIN (17 characters, alphanumeric except I,O,Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (vin && !vinRegex.test(vin)) {
      newErrors.vin = "Please enter a valid VIN (17 characters, no I, O, or Q)";
    }

    // Validate year (4 digits, reasonable range)
    const yearNum = parseInt(year);
    if (
      year &&
      (isNaN(yearNum) ||
        yearNum < 1900 ||
        yearNum > new Date().getFullYear() + 1)
    ) {
      newErrors.year = "Please enter a valid year";
    }

    // Update error state
    setErrors(newErrors);

    // If there are errors, don't proceed
    if (Object.keys(newErrors).length > 0) return;

    // Show loading state
    setIsSubmitting(true);

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
        make,
        model,
        year,
        issue,
        shop,
        txHash: mockTxHash,
      });
    }, 2000);
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
            onConnect={handleConnect}
            buttonText="Connect Wallet"
            requiredChainId="0xaa36a7" // Sepolia testnet
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Register Repair
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="VIN"
              fullWidth
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              error={!!errors.vin}
              helperText={
                errors.vin || "Vehicle Identification Number (17 characters)"
              }
            />
            <TextField
              label="Make"
              fullWidth
              value={make}
              onChange={(e) => setMake(e.target.value)}
              error={!!errors.make}
              helperText={errors.make}
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

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!walletAddress || isSubmitting}
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
