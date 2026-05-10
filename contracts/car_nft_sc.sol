// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.0/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.0/contracts/token/ERC20/IERC20.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.0/contracts/access/Ownable.sol";

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
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);

    constructor(address rewardTokenAddress)
        ERC721("VinCidRegistry", "VIN")
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
        bool isNewMint = currentOwner == address(0);

        if (!isNewMint) {
            require(
                _isApprovedOrOwner(msg.sender, tokenId),
                "Not authorized to update this car"
            );
        }

        // Effects: write all state before any external interaction.
        if (isNewMint) {
            vinKeys.push(vin);
            tokenIdToVin[tokenId] = vin;
        }
        vinToCid[vin] = cid;

        // Interactions: _safeMint may invoke onERC721Received on a contract receiver.
        if (isNewMint) {
            _safeMint(msg.sender, tokenId);
        }
        _setTokenURI(tokenId, string.concat("ipfs://", cid));

        emit CidStored(vin, cid, tokenId);

        _payReward(msg.sender);
    }

    /// @notice Withdraw tokens held by the registry. Use this to recover funds
    ///         after `setRewardToken` is called or to drain leftover balances.
    function withdrawToken(IERC20 token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        // Handle non-standard ERC-20s: succeed if call returns nothing or returns true.
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
        emit TokensWithdrawn(address(token), to, amount);
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
