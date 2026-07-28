import { isValidCID, validateCarData } from "../utils/validation";
import Web3 from "web3";
import contractAbi from "../utils/contract_abi.json";
import { getContractAddress } from "./contract_utils";
import { netLog, txLog } from "./logger";

const PINATA_BASE = process.env.REACT_APP_PINATA_API_URL.replace(/\/+$/, "");

// Best-effort compensating action: removes a pin that was created but never
// got referenced on-chain (e.g. the mint that should have followed it
// failed). Never throws — a failed unpin must not mask the mint error that
// triggered it.
const unpinFromIPFS = async (cid) => {
  netLog.debug("pinata:unpin:start", { cid });
  try {
    const response = await fetch(`${PINATA_BASE}/unpin/${cid}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
      },
    });
    if (!response.ok) {
      const body = await response.text();
      netLog.error("pinata:unpin:failed", {
        cid,
        status: response.status,
        bodyExcerpt: (body || "").slice(0, 200),
      });
      return false;
    }
    netLog.info("pinata:unpin:done", { cid });
    return true;
  } catch (error) {
    netLog.error("pinata:unpin:failed", { cid, message: error.message });
    return false;
  }
};

export const getCidFromContract = async (vin) => {
  netLog.debug("getCidFromContract:start", { vin });
  try {
    const web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      throw new Error("No wallet connected");
    }

    const chainId = await web3.eth.getChainId();
    const convertedChainId = "0x" + parseInt(Number(chainId), 10).toString(16);
    const address = getContractAddress(convertedChainId);

    const contract = new web3.eth.Contract(contractAbi, address);
    const cid = await contract.methods.getCidByVin(vin).call({ from: accounts[0] });

    netLog.info("getCidFromContract:done", { vin, found: !!cid, cid: cid || null });
    return cid;
  } catch (error) {
    netLog.error("getCidFromContract:failed", { vin, error: error.message });
    return null;
  }
};

export const getMinterAddress = async (chainId) => {
  netLog.debug("getMinterAddress:start", { chainId });
  try {
    const web3 = new Web3(window.ethereum);
    const address = getContractAddress(chainId);
    if (!address) return null;
    const contract = new web3.eth.Contract(contractAbi, address);
    const minter = await contract.methods.minter().call();
    netLog.info("getMinterAddress:done", { chainId, minter });
    return minter;
  } catch (error) {
    netLog.error("getMinterAddress:failed", { chainId, error: error.message });
    return null;
  }
};

// Reads every registered NFT off the registry and returns [{ vin, cid }] rows.
// getAllVins() and getAllCidsAsList() are index-aligned on-chain (both built
// from the same `vinKeys` array), so zipping them by index is safe.
export const getAllRegisteredNfts = async (chainId) => {
  netLog.debug("getAllRegisteredNfts:start", { chainId });
  try {
    const web3 = new Web3(window.ethereum);
    const address = getContractAddress(chainId);
    if (!address) return [];

    const contract = new web3.eth.Contract(contractAbi, address);
    const [vins, cids] = await Promise.all([
      contract.methods.getAllVins().call(),
      contract.methods.getAllCidsAsList().call(),
    ]);

    const list = vins.map((vin, i) => ({ vin, cid: cids[i] }));
    netLog.info("getAllRegisteredNfts:done", { chainId, count: list.length });
    return list;
  } catch (error) {
    netLog.error("getAllRegisteredNfts:failed", { chainId, error: error.message });
    return [];
  }
};

const storeCidOnBlockchain = async (vin, cid, recipient, chainId) => {
  txLog.info("storeCid:start", { vin, cid, recipient, chainId });

  if (!window.ethereum) {
    throw new Error("Please install MetaMask.");
  }

  const web3 = new Web3(window.ethereum);
  const accounts = await web3.eth.getAccounts();
  txLog.debug("storeCid:account", { from: accounts[0] });

  const address = getContractAddress(chainId);
  if (!address) {
    throw new Error(`No contract configured for chainId ${chainId}`);
  }

  const code = await web3.eth.getCode(address);
  txLog.debug("storeCid:bytecode", {
    address,
    bytecodeLength: code === "0x" ? 0 : code.length,
  });
  if (code === "0x" || code === "0x0") {
    throw new Error(`No contract deployed at ${address} on chain ${chainId}`);
  }

  const contract = new web3.eth.Contract(contractAbi, address);
  const method = contract.methods.storeCid(vin, cid, recipient);

  const gasEstimate = await method.estimateGas({ from: accounts[0] });
  const gas = Math.ceil(Number(gasEstimate) * 1.2);
  txLog.info("storeCid:gas", {
    estimate: gasEstimate.toString(),
    withBuffer: gas,
  });

  const sentAt = Date.now();
  txLog.info("storeCid:send", { from: accounts[0], gas });
  let receipt;
  try {
    receipt = await method.send({ from: accounts[0], gas });
  } catch (error) {
    txLog.error("storeCid:send:failed", {
      tookMs: Date.now() - sentAt,
      code: error.code,
      reason: error.reason,
      message: error.message,
    });
    throw error;
  }

  txLog.info("storeCid:mined", {
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber?.toString?.() ?? receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString?.() ?? receipt.gasUsed,
    status: receipt.status?.toString?.() ?? receipt.status,
    tookMs: Date.now() - sentAt,
  });

  return receipt.transactionHash;
};

export async function handleNFTCreation(carData, recipient, chainId) {
  txLog.info("handleNFTCreation:start", {
    vin: carData?.vinNumber,
    recipient,
    chainId,
  });

  try {
    const validation = validateCarData(carData);
    if (!validation.isValid) {
      txLog.warn("handleNFTCreation:validation_failed", validation.errors);
      throw new Error(Object.values(validation.errors).join(", "));
    }

    if (!Web3.utils.isAddress(recipient)) {
      txLog.warn("handleNFTCreation:bad_recipient", { recipient });
      throw new Error("Recipient must be a valid wallet address");
    }

    const metadata = {
      name: `Car-${carData.vinNumber}`,
      description: `Vehicle Information for VIN: ${carData.vinNumber}`,
      attributes: {
        vin: carData.vinNumber,
        make: carData.carBrand,
        model: carData.carModel,
        issueDescription: carData.issueDescription,
        repairShop: carData.repairShop,
        year: carData.carYear,
        mileage: carData.mileage,
        timestamp: new Date().toISOString(),
      },
    };

    const pinUrl = `${PINATA_BASE}/pinJSONToIPFS`;
    const pinStartedAt = Date.now();
    netLog.info("pinata:pin:start", { url: pinUrl, vin: carData.vinNumber });

    const response = await fetch(pinUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `Car-${carData.vinNumber}`,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      netLog.error("pinata:pin:http_error", {
        status: response.status,
        statusText: response.statusText,
        bodyExcerpt: (body || "").slice(0, 200),
        tookMs: Date.now() - pinStartedAt,
      });
      throw new Error(
        `Pinata ${response.status}: ${body || response.statusText || "no body"}`
      );
    }

    const result = await response.json();
    netLog.info("pinata:pin:done", {
      ipfsHash: result.IpfsHash,
      pinSize: result.PinSize,
      tookMs: Date.now() - pinStartedAt,
    });

    let txHash;
    try {
      txHash = await storeCidOnBlockchain(
        carData.vinNumber,
        result.IpfsHash,
        recipient,
        chainId
      );
    } catch (mintError) {
      // The pin above succeeded but nothing on-chain will ever reference it —
      // clean it up instead of leaving a permanent orphaned IPFS entry.
      await unpinFromIPFS(result.IpfsHash);
      throw mintError;
    }
    txLog.info("handleNFTCreation:success", {
      ipfsHash: result.IpfsHash,
      txHash,
    });

    return {
      success: true,
      message: "NFT created successfully",
      ipfsHash: result.IpfsHash,
      txHash,
    };
  } catch (error) {
    txLog.error("handleNFTCreation:failed", {
      vin: carData?.vinNumber,
      message: error.message,
    });
    return {
      success: false,
      message: error.message,
    };
  }
}

export async function fetchNFTMetadata(cid) {
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
  netLog.debug("ipfs:fetch:start", { cid, url });
  const startedAt = Date.now();
  try {
    if (!isValidCID(cid)) {
      throw new Error("Invalid CID format");
    }

    const response = await fetch(url);

    if (!response.ok) {
      netLog.error("ipfs:fetch:http_error", {
        cid,
        status: response.status,
        statusText: response.statusText,
        tookMs: Date.now() - startedAt,
      });
      throw new Error("Failed to fetch NFT metadata");
    }

    const metadata = await response.json();
    netLog.info("ipfs:fetch:done", { cid, tookMs: Date.now() - startedAt });
    return {
      success: true,
      data: {
        vin: metadata.attributes.vin,
        make: metadata.attributes.make,
        model: metadata.attributes.model,
        year: metadata.attributes.year,
        mileage: metadata.attributes.mileage,
        issueDescription: metadata.attributes.issueDescription,
        repairShop: metadata.attributes.repairShop,
      },
    };
  } catch (error) {
    netLog.error("ipfs:fetch:failed", { cid, error: error.message });
    return {
      success: false,
      message: error.message,
    };
  }
}
