// MetaMaskLogin.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button, Box, Typography } from '@mui/material';

const MetaMaskLogin = () => {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || null);
    };

    if (window.ethereum) {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setError('');
    } catch (err) {
      setError('Connection failed: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center' }}>
      {account ? (
        <Box>
          <Typography color="success.main" fontWeight="bold">Connected as:</Typography>
          <Typography sx={{ mt: 1 }}>{account}</Typography>
        </Box>
      ) : (
        <Button
          variant="contained"
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </Button>
      )}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
      )}
    </Box>
  );
};

export default MetaMaskLogin;
