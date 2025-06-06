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
  const [carId, setCarId] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [issue, setIssue] = useState("");
  const [shop, setShop] = useState("");
  const [txHash, setTxHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const handleConnect = (address, chainId) => {
    setWalletAddress(address);
    console.log("Connected to chain:", chainId);
  };

  const handleDisconnect = () => {
    setWalletAddress("");
  };

  const handleSubmit = () => {
    console.log("Submitting repair record:", {
      carId,
      make,
      model,
      year,
      vin,
      issue,
      shop,
    });
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
            onDisconnect={handleDisconnect}
            buttonText="Connect Wallet"
            requiredChainId="0x5" // Goerli testnet - adjust as needed
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
              label="Car ID"
              fullWidth
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
            />
            <TextField
              label="Make"
              fullWidth
              value={make}
              onChange={(e) => setMake(e.target.value)}
            />
            <TextField
              label="Model"
              fullWidth
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <TextField
              label="Year"
              fullWidth
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <TextField
              label="VIN"
              fullWidth
              value={vin}
              onChange={(e) => setVin(e.target.value)}
            />
            <TextField
              label="Issue Fixed"
              fullWidth
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
            />
            <TextField
              label="Repair Shop"
              fullWidth
              value={shop}
              onChange={(e) => setShop(e.target.value)}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!walletAddress}
            >
              Submit Repair
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
