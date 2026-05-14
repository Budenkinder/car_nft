import { isValidCID, validateCarData } from "../utils/validation";
import Web3 from "web3";
import contractAbi from "../utils/contract_abi.json";
import { getContractAddress } from "./contract_utils";

const PINATA_BASE = process.env.REACT_APP_PINATA_API_URL.replace(/\/+$/, "");

export const getCidFromContract = async (vin) => {
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

    return cid;
  } catch (error) {
    console.error("Error fetching CID:", error);
    return null;
  }
};

export const getMinterAddress = async (chainId) => {
  try {
    const web3 = new Web3(window.ethereum);
    const address = getContractAddress(chainId);
    if (!address) return null;
    const contract = new web3.eth.Contract(contractAbi, address);
    return await contract.methods.minter().call();
  } catch (error) {
    console.error("Error fetching minter:", error);
    return null;
  }
};

const storeCidOnBlockchain = async (vin, cid, recipient, chainId) => {
  console.log("[storeCidOnBlockchain] start", { vin, cid, recipient, chainId });

  if (!window.ethereum) {
    throw new Error("Please install MetaMask.");
  }

  const web3 = new Web3(window.ethereum);
  const accounts = await web3.eth.getAccounts();
  console.log("[storeCidOnBlockchain] account", accounts[0]);

  const address = getContractAddress(chainId);
  console.log("[storeCidOnBlockchain] contract address", address);
  if (!address) {
    throw new Error(`No contract configured for chainId ${chainId}`);
  }

  const code = await web3.eth.getCode(address);
  console.log("[storeCidOnBlockchain] bytecode length", code === "0x" ? 0 : code.length);
  if (code === "0x" || code === "0x0") {
    throw new Error(`No contract deployed at ${address} on chain ${chainId}`);
  }

  const contract = new web3.eth.Contract(contractAbi, address);
  const method = contract.methods.storeCid(vin, cid, recipient);

  const gasEstimate = await method.estimateGas({ from: accounts[0] });
  const gas = Math.ceil(Number(gasEstimate) * 1.2);
  console.log("[storeCidOnBlockchain] gas", { estimate: gasEstimate.toString(), withBuffer: gas });

  console.log("[storeCidOnBlockchain] sending tx");
  const tx = await method.send({ from: accounts[0], gas });
  console.log("[storeCidOnBlockchain] mined", { txHash: tx.transactionHash, blockNumber: tx.blockNumber });

  return tx.transactionHash;
};

export async function handleNFTCreation(carData, recipient, chainId) {
  console.log("[handleNFTCreation] start", { vin: carData?.vinNumber, recipient, chainId });

  try {
    const validation = validateCarData(carData);
    console.log("[handleNFTCreation] validation", validation);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(", "));
    }

    if (!Web3.utils.isAddress(recipient)) {
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

    console.log("[handleNFTCreation] pinning to IPFS", `${PINATA_BASE}/pinJSONToIPFS`);
    const response = await fetch(
      `${PINATA_BASE}/pinJSONToIPFS`,
      {
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
      }
    );
    console.log("[handleNFTCreation] pinata response", response.status);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Pinata ${response.status}: ${body || response.statusText || "no body"}`);
    }

    const result = await response.json();
    console.log("[handleNFTCreation] pinned CID", result.IpfsHash);

    const txHash = await storeCidOnBlockchain(carData.vinNumber, result.IpfsHash, recipient, chainId);
    console.log("[handleNFTCreation] success", { ipfsHash: result.IpfsHash, txHash });

    return {
      success: true,
      message: "NFT created successfully",
      ipfsHash: result.IpfsHash,
      txHash,
    };
  } catch (error) {
    console.error("[handleNFTCreation] failed", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

export async function fetchNFTMetadata(cid) {
  try {
    if (!isValidCID(cid)) {
      throw new Error("Invalid CID format");
    }

    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);

    if (!response.ok) {
      throw new Error("Failed to fetch NFT metadata");
    }

    const metadata = await response.json();
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
    console.error("Error fetching NFT metadata:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}
