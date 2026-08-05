// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title VinCidRegistryV1Mock
/// @notice Test-only. A frozen snapshot of `VinCidRegistry` exactly as it was
///         before ADR 0035 (single `minter` EOA, no `AccessControlUpgradeable`,
///         open updates). Used solely by
///         test/VinCidRegistry.upgrade.test.js to deploy "the pre-ADR-0035
///         registry", write real state against it, then upgrade the proxy to
///         the current `VinCidRegistry` and assert every pre-existing value
///         (including `minter`, now dead-but-retained storage) survives
///         byte-for-byte, and that `AccessControlUpgradeable`'s ERC-7201
///         namespaced storage does not collide with this contract's
///         sequential slots or `__gap`. Never deployed by scripts/deploy.js
///         or scripts/upgrade.js.
contract VinCidRegistryV1Mock is
    Initializable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Replaces the constructor for an upgradeable contract. Callable
    ///         exactly once, immediately after the proxy is deployed.
    function initialize(address rewardTokenAddress, address initialMinter) public initializer {
        __ERC721_init("VinCidRegistry", "VIN");
        __ERC721URIStorage_init();
        __Ownable_init(msg.sender);

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

    /// @dev Gates `upgradeToAndCall` (inherited from `UUPSUpgradeable`) to the
    ///      contract owner. `minter` (mint authority) and `owner` (upgrade
    ///      authority) remain distinct roles.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Storage gap: reserved slots so a future upgrade can append new state
    // variables above without shifting the layout of the fields declared
    // above. Shrink this array (never remove it entirely) as fields are added.
    uint256[50] private __gap;
}
