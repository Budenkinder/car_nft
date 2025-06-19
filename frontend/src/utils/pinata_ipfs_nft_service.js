import { isValidCID, validateCarData } from "../utils/validation";
import Web3 from "web3";
import { CAR_NFT_CONTRACT_ABI, getContractAddress } from "./contract_utils";

export const getCidFromContract = async (vin) => {
  try {
    const web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const chainId = await web3.eth.getChainId();
    console.log("chainId: ", Number(chainId));
    const convertedChainId = "0x" + parseInt(Number(chainId), 10).toString(16);
    console.log(convertedChainId); // Output: 0xaa36a7
    const address = getContractAddress(convertedChainId.toString());
    console.log(address);

    console.log("contract address: ", address.toString());
    const contract = new web3.eth.Contract(
      CAR_NFT_CONTRACT_ABI,
      getContractAddress(convertedChainId)
    );

    const cid = await contract.methods.getCidByVin(vin).call({
      from: accounts[0],
    });

    console.log("CID for VIN", vin, ":", cid);

    return cid;
  } catch (error) {
    console.error("Error fetching CID:", error);
    return null;
  }
};

const storeCidOnBlockchain = async (vin, cid, chainId) => {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
    return;
  }

  try {
    const web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const contract = new web3.eth.Contract(
      CAR_NFT_CONTRACT_ABI,
      getContractAddress(chainId)
    );

    const tx = await contract.methods.storeCid(vin, cid).send({
      from: accounts[0],
    });

    console.log("Transaction successful:", tx.transactionHash);
  } catch (error) {
    console.error("Error storing CID:", error);
  }
};

// the token uri is the IPFS hash of the metadata
// That CID becomes accessible at:
// ipfs://QmABC123... (native IPFS link)
// https://gateway.pinata.cloud/ipfs/QmABC123... (HTTP link)
// https://ipfs.io/ipfs/QmABC123... (public IPFS gateway)

export async function handleNFTCreation(carData, chainId) {
  try {
    const validation = validateCarData(carData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
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

    console.log("metadata: ", metadata);

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

    // store the vin and cid here
    const txResponse = await storeCidOnBlockchain(
      carData.vinNumber,
      result.IpfsHash,
      chainId
    );

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
    console.log(metadata);
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
