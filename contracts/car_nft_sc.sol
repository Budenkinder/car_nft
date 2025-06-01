// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/Ownable.sol";

contract CarRepairNFT is ERC721URIStorage, Ownable {
    struct RepairRecord {
        string issue;
        uint256 date;
        string shop;
    }

    uint256 private _tokenIdCounter = 1;

    mapping(string => uint256) public carIdToTokenId;
    mapping(uint256 => RepairRecord[]) public tokenIdToRepairs;

    constructor() ERC721("CarRepairNFT", "CRNFT") {}

    function carIdExists(string memory carId) public view returns (bool) {
        return carIdToTokenId[carId] != 0;
    }

    function createCarNFT(
        string memory carId,
        string memory metadataURI,
        string memory issue,
        string memory shop
    ) public onlyOwner returns (uint256) {
        require(!carIdExists(carId), "Car ID already registered");

        uint256 newTokenId = _tokenIdCounter++;
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        carIdToTokenId[carId] = newTokenId;
        tokenIdToRepairs[newTokenId].push(
            RepairRecord(issue, block.timestamp, shop)
        );

        return newTokenId;
    }

    function addRepairRecord(
        string memory carId,
        string memory issue,
        string memory shop,
        string memory updatedMetadataURI
    ) public onlyOwner {
        require(carIdExists(carId), "Car ID not registered");
        uint256 tokenId = carIdToTokenId[carId];
        tokenIdToRepairs[tokenId].push(
            RepairRecord(issue, block.timestamp, shop)
        );
        _setTokenURI(tokenId, updatedMetadataURI);
    }

    function getRepairHistory(
        string memory carId
    )
        public
        view
        returns (RepairRecord[] memory records, string memory metadataURI)
    {
        require(carIdExists(carId), "Car ID not registered");
        uint256 tokenId = carIdToTokenId[carId];
        return (tokenIdToRepairs[tokenId], tokenURI(tokenId));
    }
}
