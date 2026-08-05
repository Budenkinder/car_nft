import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { getOrgRoleHolders } from "../utils/pinata_ipfs_nft_service";
import { uiLog } from "../utils/logger";

// ADR 0035 / decision 2026-08-04-002: read-only sidebar showing every wallet
// currently holding ORG_ROLE. This is public on-chain information — same
// trust level as "Show All Registered NFTs" — and it is display only.
// Granting/revoking ORG_ROLE happens outside this app entirely, via the
// deployer running scripts/manage-org-role.js.
export default function OrgWalletsList({ chainId }) {
  const [holders, setHolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!chainId) return;
    setIsLoading(true);
    setError("");
    try {
      const list = await getOrgRoleHolders(chainId);
      setHolders(list);
      setHasLoaded(true);
      uiLog.info("orgWalletsList:loaded", { chainId, count: list.length });
    } catch (err) {
      // getOrgRoleHolders never throws, but guard anyway — a failed read
      // must show a visible error, not a silent empty list that reads the
      // same as "zero organizations approved yet."
      setError("Failed to load the approved organizations list.");
      uiLog.error("orgWalletsList:failed", { chainId, message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Paper elevation={2} sx={{ p: 3, width: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Approved Organizations
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Wallets currently allowed to register or update VIN records.
      </Typography>

      <Button
        variant="outlined"
        size="small"
        onClick={load}
        disabled={isLoading || !chainId}
        startIcon={isLoading ? <CircularProgress size={16} /> : null}
      >
        {isLoading ? "Refreshing..." : "Refresh"}
      </Button>

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {!error && hasLoaded && holders.length === 0 && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          No organizations approved yet.
        </Typography>
      )}

      {holders.length > 0 && (
        <List dense sx={{ mt: 1 }}>
          {holders.map((address) => (
            <ListItem key={address} disableGutters divider>
              <ListItemText
                primary={address}
                primaryTypographyProps={{
                  sx: { fontFamily: "monospace", fontSize: "0.85rem", wordBreak: "break-all" },
                }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

OrgWalletsList.propTypes = {
  chainId: PropTypes.string,
};
