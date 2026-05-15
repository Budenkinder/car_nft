// MetaMaskLogin.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import { walletLog } from '../utils/logger';

//functions

const MetaMaskLogin = ({
  onConnect,
  buttonText = "Connect MetaMask to Sepolia",
}) => {
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chainId, setChainId] = useState(null);

  const walletAddressRef = useRef(walletAddress);
  walletAddressRef.current = walletAddress;

  const requiredChainId = "0xaa36a7"; // Sepolia testnet

  useEffect(() => {
    if (!window.ethereum) {
      walletLog.warn("window.ethereum unavailable — MetaMask not detected");
      return;
    }

    const handleAccountsChanged = async (accounts) => {
      if (!accounts || accounts.length === 0) {
        walletLog.info("accountsChanged: disconnected", {
          previous: walletAddressRef.current || null,
        });
        setWalletAddress("");
        setChainId(null);
        if (onConnect) onConnect("", "");
      } else {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        walletLog.info("accountsChanged: account switched", {
          previous: walletAddressRef.current || null,
          current: accounts[0],
          chainId: currentChainId,
        });
        setWalletAddress(accounts[0]);
        setChainId(currentChainId);
        if (onConnect) onConnect(accounts[0], currentChainId);
      }
    };

    const handleChainChanged = (newChainId) => {
      const matches = newChainId === requiredChainId;
      walletLog.info("chainChanged", {
        chainId: newChainId,
        required: requiredChainId,
        matches,
      });
      setChainId(newChainId);
      if (!matches) {
        setError('Wrong network detected. Click to switch.');
      } else {
        setError('');
      }
      if (walletAddressRef.current && onConnect) {
        onConnect(walletAddressRef.current, newChainId);
      }
    };

    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
          walletLog.info("checkConnection: existing session", {
            account: accounts[0],
            chainId: currentChainId,
            matches: currentChainId === requiredChainId,
          });
          setWalletAddress(accounts[0]);
          setChainId(currentChainId);
          if (onConnect) onConnect(accounts[0], currentChainId);
        } else {
          walletLog.debug("checkConnection: no existing session");
        }
      } catch (err) {
        walletLog.error("checkConnection failed", { error: err.message });
      }
    };

    checkConnection();
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [onConnect]);

  const switchNetwork = async () => {
    walletLog.info("switchNetwork:start", { target: requiredChainId });
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: requiredChainId }],
      });
      walletLog.info("switchNetwork:success", { target: requiredChainId });
    } catch (err) {
      walletLog.error("switchNetwork:failed", {
        target: requiredChainId,
        code: err.code,
        message: err.message,
      });
      if (err.code === 4902) {
        setError('Please add this network to your MetaMask.');
      } else {
        setError('Failed to switch network.');
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      walletLog.warn("connectWallet:no_metamask");
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    walletLog.info("connectWallet:start");
    setIsLoading(true);
    setError('');

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

      walletLog.info("connectWallet:success", {
        account: accounts[0],
        chainId: currentChainId,
        matches: currentChainId === requiredChainId,
      });

      setWalletAddress(accounts[0]);
      setChainId(currentChainId);

      if (currentChainId !== requiredChainId) {
        walletLog.warn("connectWallet:wrong_network", {
          chainId: currentChainId,
          required: requiredChainId,
        });
        setError('Please switch to the required network. Click to switch.');
      }

      if (onConnect) {
        onConnect(accounts[0], currentChainId);
      }
    } catch (err) {
      if (err.code === 4001) {
        walletLog.warn("connectWallet:user_rejected");
        setError('Connection rejected. Please approve the MetaMask connection.');
      } else {
        walletLog.error("connectWallet:failed", {
          code: err.code,
          message: err.message,
        });
        setError(`Failed to connect: ${err.message || 'Unknown error'}`);
      }
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
        disabled={walletAddress.length > 0 || isLoading}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {isLoading ? 'Connecting...' : walletAddress ? 'Connected to MetaMask' : buttonText}
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
