import { isValidCID, validateCarData } from "../utils/validation";
import Web3 from "web3";

const CONTRACT_ABI = {};
export const getCidFromContract = async (vin, contractAddress, abi) => {
  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(abi, contractAddress);
  return await contract.methods.getCidByVin(vin).call();
};

// the token uri is the IPFS hash of the metadata
// That CID becomes accessible at:
// ipfs://QmABC123... (native IPFS link)
// https://gateway.pinata.cloud/ipfs/QmABC123... (HTTP link)
// https://ipfs.io/ipfs/QmABC123... (public IPFS gateway)

export async function handleNFTCreation(carData) {
  try {
    const validation = validateCarData(carData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const metadata = {
      name: `Car-${carData.vin}`,
      description: `Vehicle Information for VIN: ${carData.vin}`,
      attributes: {
        vin: carData.vin,
        make: carData.make,
        model: carData.model,
        year: carData.year,
        mileage: carData.mileage,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`${process.env.REACT_APP_PINATA_API_URL}/pinJSONToIPFS`);
    //
    const response = await fetch(
      `${process.env.REACT_APP_PINATA_API_URL}/pinJSONToIPFS`,
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
      throw new Error(`Failed to create NFT: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: "NFT created successfully",
      ipfsHash: result.IpfsHash,
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
