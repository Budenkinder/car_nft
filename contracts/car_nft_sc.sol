// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.0/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.0/contracts/token/ERC20/IERC20.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.0/contracts/access/Ownable.sol";

/// @title VinCidRegistry
/// @notice One NFT per VIN. The tokenURI points at the latest IPFS CID for the
///         car's repair history. Only the `minter` (a registry operator address,
///         separate from the contract `owner`) may mint new VIN NFTs, and the
///         NFT is assigned to a `recipient` argument supplied by the minter —
///         typically the car owner's wallet. Updates to an existing record are
///         open in this POC build.
contract VinCidRegistry is ERC721URIStorage, Ownable {
    mapping(string => string) private vinToCid;
    mapping(uint256 => string) private tokenIdToVin;
    string[] private vinKeys;

    IERC20 public rewardToken;
    uint256 public rewardAmount;

    /// @notice Address authorized to mint new VIN NFTs. Separate from `owner()`
    ///         so a back-office "registry operator" can onboard cars without
    ///         holding admin powers (or vice versa).
    address public minter;

    event CidStored(string vin, string cid, uint256 tokenId);
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event MinterChanged(address indexed previousMinter, address indexed newMinter);

    constructor(address rewardTokenAddress, address initialMinter)
        ERC721("VinCidRegistry", "VIN")
    {
        require(initialMinter != address(0), "Minter required");
        rewardToken = IERC20(rewardTokenAddress);
        minter = initialMinter;
        emit MinterChanged(address(0), initialMinter);
    }

    /// @notice Mint a new car NFT (first call for a VIN) or update the CID on
    ///         an existing one. Mints are gated to the `minter` address and the
    ///         NFT is assigned to `recipient`. Updates are open in this POC.
    /// @param vin       17-character VIN.
    /// @param cid       IPFS CID for the metadata JSON. Stored as `ipfs://<cid>`.
    /// @param recipient Wallet that receives the NFT on a new mint. Ignored
    ///                  on updates (pass `address(0)` if you like — it isn't read).
    function storeCid(string calldata vin, string calldata cid, address recipient) external {
        require(bytes(vin).length == 17, "VIN must be 17 characters");
        require(bytes(cid).length > 0, "CID required");

        uint256 tokenId = _tokenIdFromVin(vin);
        bool isNewMint = _ownerOf(tokenId) == address(0);

        if (isNewMint) {
            require(msg.sender == minter, "Only minter can mint");
            require(recipient != address(0), "Recipient required");
        }

        // Effects: write all state before any external interaction.
        if (isNewMint) {
            vinKeys.push(vin);
            tokenIdToVin[tokenId] = vin;
        }
        vinToCid[vin] = cid;

        // Interactions: _safeMint may invoke onERC721Received on a contract receiver.
        if (isNewMint) {
            _safeMint(recipient, tokenId);
        }
        _setTokenURI(tokenId, string.concat("ipfs://", cid));

        emit CidStored(vin, cid, tokenId);

        // Rewards only on mint — prevents CRT drain on repeat updates. Paid to
        // the new NFT holder so the operator (minter) isn't paying themselves.
        if (isNewMint) {
            _payReward(recipient);
        }
    }

    /// @notice Owner-only: change the minter address.
    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Minter required");
        emit MinterChanged(minter, newMinter);
        minter = newMinter;
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
