// MetaMaskLogin.jsx
import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';

const MetaMaskLogin = ({ 
  onConnect, 
  buttonText = "Connect MetaMask to Sepolia",
}) => {
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chainId, setChainId] = useState(null);

  const requiredChainId = "0xaa36a7"; // Sepolia testnet

  // Check for existing connection on component mount
  useEffect(() => {

    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            setChainId(chainId);
            if (onConnect) {
              onConnect(accounts[0], chainId);
            }
          }
        } catch (err) {
          console.error("Error checking existing connection:", err);
        }
      }
    };
    
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [onConnect]);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setWalletAddress("");
      setChainId("");
      onConnect("", "");
    } else {
      // User switched accounts
      if (onConnect) {
        setWalletAddress(accounts[0]);
        setChainId(chainId);
        onConnect(accounts[0], chainId);
      }
    }
  };

  const handleChainChanged = (newChainId) => {

    // Check if the new chain matches required chain
    if (newChainId !== requiredChainId) {
      setError(`Wrong network detected. Click to switch.`);
    } else {
      setError('');
    }
    
    // Update connection with new chain
    if (walletAddress.length > 0 && onConnect) {
      onConnect(walletAddress, newChainId);
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: requiredChainId }],
      });
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        setError('Please add this network to your MetaMask.');
      } else {
        setError('Failed to switch network.');
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      setWalletAddress(accounts[0]);
      setChainId(chainId);
       

      // Check if on correct network
      if (chainId !== requiredChainId) {
        setError(`Please switch to the required network. Click to switch.`);
      }
      
      if (onConnect) {
        onConnect(accounts[0], chainId);
      }
    } catch (err) {
      if (err.code === 4001) {
        // User rejected the request
        setError('Connection rejected. Please approve the MetaMask connection.');
      } else {
        setError(`Failed to connect: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <Box sx={{ mb: 3 }}>
    <Button
      variant="contained"
      color="primary"
      onClick={!walletAddress ? connectWallet : undefined}
      disabled={walletAddress.length > 0 ? true : false || isLoading}
      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
    >
      {isLoading ? 'Connecting...' : walletAddress ? 'Connected to MetaMaSK' : buttonText}
    </Button>

    {walletAddress && (
      <Typography sx={{ mt: 1 }}>
        Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
      </Typography>
    )}

    {chainId !== requiredChainId && walletAddress && (
      <Typography
        color="warning.main"
        sx={{ mt: 1, cursor: 'pointer' }}
        onClick={switchNetwork}
      >
        Wrong network. Click to switch.
      </Typography>
    )}

    {error && (
      <Typography
        color="error"
        sx={{ mt: 1, cursor: error.includes('switch') ? 'pointer' : 'default' }}
        onClick={error.includes('switch') ? switchNetwork : null}
      >
        {error}
      </Typography>
    )}
  </Box>
);
};

MetaMaskLogin.propTypes = {
  onConnect: PropTypes.func,
  buttonText: PropTypes.string,
};

export default MetaMaskLogin;
