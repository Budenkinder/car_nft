// MetaMaskLogin.jsx
import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';

const MetaMaskLogin = ({ 
  onConnect, 
  onDisconnect, 
  buttonText = "Connect MetaMask",
  requiredChainId = "0x10xaa36a7"}) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chainId, setChainId] = useState(null);



  // Check for existing connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            setChainId(chainId);
            setWalletAddress(accounts[0]);
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
    
    // Set up event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
    
    // Clean up listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [onConnect, onDisconnect]);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      handleDisconnect();
    } else {
      // User switched accounts
      setWalletAddress(accounts[0]);
      if (onConnect) {
        onConnect(accounts[0], chainId);
      }
    }
  };

  const handleChainChanged = (newChainId) => {
    setChainId(newChainId);
    // Force page refresh as recommended by MetaMask
    window.location.reload();
  };

  const handleDisconnect = () => {
    setWalletAddress('');
    setChainId(null);
    if (onDisconnect) {
      onDisconnect();
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
      const address = accounts[0];
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      setWalletAddress(address);
      setChainId(chainId);
      
      // Check if on correct network
      if (chainId !== requiredChainId) {
        setError(`Please switch to the required network. Click to switch.`);
      }
      
      if (onConnect) {
        onConnect(address, chainId);
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

  const disconnectWallet = () => {
    setWalletAddress('');
    setChainId(null);
    setError('');
    if (onDisconnect) {
      onDisconnect();
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {!walletAddress ? (
        <>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={connectWallet}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Connecting...' : buttonText}
          </Button>
          {error && (
            <Typography 
              color="error" 
              sx={{ mt: 1, cursor: error.includes('switch') ? 'pointer' : 'default' }}
              onClick={error.includes('switch') ? switchNetwork : null}
            >
              {error}
            </Typography>
          )}
        </>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography>
            Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
          </Typography>
          {chainId !== requiredChainId && (
            <Typography 
              color="warning.main" 
              sx={{ mt: 1, cursor: 'pointer' }}
              onClick={switchNetwork}
            >
              Wrong network. Click to switch.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

MetaMaskLogin.propTypes = {
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
  buttonText: PropTypes.string,
  requiredChainId: PropTypes.string
};

export default MetaMaskLogin;
