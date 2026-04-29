// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title VinCidRegistry
/// @notice One NFT per VIN. The tokenURI points at the latest IPFS CID for the
///         car's repair history. Updating a record updates the tokenURI of the
///         existing NFT (no new mint), and any successful write rewards the
///         caller with CRT tokens held by this contract.
contract VinCidRegistry is ERC721URIStorage, Ownable {
    mapping(string => string) private vinToCid;
    mapping(uint256 => string) private tokenIdToVin;
    string[] private vinKeys;

    IERC20 public rewardToken;
    uint256 public rewardAmount;

    event CidStored(string vin, string cid, uint256 tokenId);

    constructor(address rewardTokenAddress)
        ERC721("VinCidRegistry", "VIN")
        Ownable(msg.sender)
    {
        rewardToken = IERC20(rewardTokenAddress);
    }

    /// @notice Mint a new car NFT (first call for a VIN) or update the CID on an
    ///         existing one. Updates require msg.sender to be the NFT owner or
    ///         an approved operator.
    function storeCid(string calldata vin, string calldata cid) external {
        require(bytes(vin).length == 17, "VIN must be 17 characters");
        require(bytes(cid).length > 0, "CID required");

        uint256 tokenId = _tokenIdFromVin(vin);
        address currentOwner = _ownerOf(tokenId);

        if (currentOwner == address(0)) {
            _safeMint(msg.sender, tokenId);
            vinKeys.push(vin);
            tokenIdToVin[tokenId] = vin;
        } else {
            require(
                _isAuthorized(currentOwner, msg.sender, tokenId),
                "Not authorized to update this car"
            );
        }

        vinToCid[vin] = cid;
        _setTokenURI(tokenId, string.concat("ipfs://", cid));

        emit CidStored(vin, cid, tokenId);

        _payReward(msg.sender);
    }

    function getCidByVin(string calldata vin) external view returns (string memory) {
        return vinToCid[vin];
    }

    function getAllVins() external view returns (string[] memory) {
        return vinKeys;
    }

    function getAllCidsAsList() external view returns (string[] memory) {
        string[] memory cids = new string[](vinKeys.length);
        for (uint256 i = 0; i < vinKeys.length; ++i) {
            cids[i] = vinToCid[vinKeys[i]];
        }
        return cids;
    }

    function setRewardToken(address newToken) external onlyOwner {
        rewardToken = IERC20(newToken);
    }

    function setRewardAmount(uint256 amount) external onlyOwner {
        rewardAmount = amount;
    }

    function _tokenIdFromVin(string memory vin) internal pure returns (uint256) {
        return uint256(keccak256(bytes(vin)));
    }

    function _payReward(address to) internal {
        if (address(rewardToken) == address(0) || rewardAmount == 0) return;
        try rewardToken.transfer(to, rewardAmount) {} catch {}
    }
}
