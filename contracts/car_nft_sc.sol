// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VinCidRegistry {
    address public owner;

    // Mapping from VIN (string) to CID (string)
    mapping(string => string) private vinToCid;

    event CidStored(string vin, string cid);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Store the CID associated with a VIN (can be called by anyone, or restrict if needed)
    function storeCid(string calldata vin, string calldata cid) external {
        require(bytes(vin).length == 17, "VIN must be 17 characters");
        vinToCid[vin] = cid;

        emit CidStored(vin, cid);
    }

    /// @notice Fetch the CID for a given VIN
    function getCidByVin(
        string calldata vin
    ) external view returns (string memory) {
        return vinToCid[vin];
    }

    /// @notice (Optional) Only allow the owner to store data
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }
}
