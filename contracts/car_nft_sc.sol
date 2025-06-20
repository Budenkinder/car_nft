// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VinCidRegistry {
    address public owner;

    // Mapping from VIN (string) to CID (string)
    mapping(string => string) vinToCid;
    string[] private vinKeys;

    event CidStored(string vin, string cid);

    constructor() {
        owner = msg.sender;
    }

    function getAllCidsAsList() external view returns (string[] memory) {
        string[] memory cidList = new string[](vinKeys.length);
        for (uint i = 0; i < cidList.length; ++i) {
            cidList[i] = vinToCid[vinKeys[i]];
        }

        return cidList;
    }

    /// @notice Store the CID associated with a VIN (can be called by anyone, or restrict if needed)
    function storeCid(string calldata vin, string calldata cid) external {
        require(bytes(vin).length == 17, "VIN must be 17 characters");
        vinToCid[vin] = cid;
        vinKeys.push(vin);

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
