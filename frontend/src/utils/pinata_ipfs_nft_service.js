import { create } from "@pinata/sdk";

const pinata = create({
  pinataApiKey: process.env.REACT_APP_PINATA_API_KEY,
  pinataSecretApiKey: process.env.REACT_APP_PINATA_SECRET_KEY,
});

export async function handleNFTCreation(carData, vin) {
  try {
    // Check if NFT with this VIN already exists
    const filters = {
      metadata: {
        name: `Car-${vin}`,
      },
    };

    const existingPins = await pinata.pinList(filters);

    // Prepare metadata
    const metadata = {
      name: `Car-${vin}`,
      description: `Vehicle Information for VIN: ${vin}`,
      attributes: {
        vin: carData.vin,
        make: carData.make,
        model: carData.model,
        year: carData.year,
        mileage: carData.mileage,
        lastUpdate: new Date().toISOString(),
      },
    };

    if (existingPins.count > 0) {
      // Update existing NFT
      const existingPin = existingPins.rows[0];
      await pinata.hashMetadata(existingPin.ipfs_pin_hash, metadata);
      return {
        success: true,
        message: "NFT metadata updated successfully",
        ipfsHash: existingPin.ipfs_pin_hash,
      };
    } else {
      // Create new NFT
      const result = await pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `Car-${vin}`,
        },
      });

      return {
        success: true,
        message: "NFT created successfully",
        ipfsHash: result.IpfsHash,
      };
    }
  } catch (error) {
    console.error("Error handling NFT:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}
