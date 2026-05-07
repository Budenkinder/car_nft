import { isValidCID, validateCarData } from "../utils/validation";
import Web3 from "web3";
import contractAbi from "../utils/contract_abi.json";
import { getContractAddress } from "./contract_utils";

const PINATA_BASE = (
  process.env.REACT_APP_PINATA_API_URL || "https://api.pinata.cloud/pinning"
).replace(/\/+$/, "");

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

const storeCidOnBlockchain = async (vin, cid, chainId) => {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask.");
  }

  const web3 = new Web3(window.ethereum);
  const accounts = await web3.eth.getAccounts();

  const contract = new web3.eth.Contract(contractAbi, getContractAddress(chainId));
  const tx = await contract.methods.storeCid(vin, cid).send({ from: accounts[0] });

  return tx.transactionHash;
};

export async function handleNFTCreation(carData, chainId) {
  try {
    const validation = validateCarData(carData);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(", "));
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

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Pinata ${response.status}: ${body || response.statusText || "no body"}`);
    }

    const result = await response.json();
    const txHash = await storeCidOnBlockchain(carData.vinNumber, result.IpfsHash, chainId);

    return {
      success: true,
      message: "NFT created successfully",
      ipfsHash: result.IpfsHash,
      txHash,
    };
  } catch (error) {
    console.error("Error handling NFT:", error);
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
