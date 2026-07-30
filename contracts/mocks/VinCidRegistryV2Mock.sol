// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title VinCidRegistryV2Mock
/// @notice Test-only. Stands in for "the next version" of VinCidRegistry: same
///         storage layout and same external functions through `minter`, plus
///         one appended field (consuming one slot of the real contract's
///         storage gap) and a `versionTag()` view. Used solely by
///         test/VinCidRegistry.upgrade.test.js to prove that upgrading a live
///         proxy to a new implementation preserves all pre-upgrade state and
///         keeps existing functions working. Never deployed by
///         scripts/deploy.js or scripts/upgrade.js.
contract VinCidRegistryV2Mock is
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
    address public minter;

    // New in this "version" — occupies the first slot of what was
    // VinCidRegistry's __gap. Starting empty (not corrupted with any
    // pre-upgrade field's data) is exactly what the upgrade test asserts.
    string public newFeatureFlag;

    event CidStored(string vin, string cid, uint256 tokenId);
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event MinterChanged(address indexed previousMinter, address indexed newMinter);

    uint256[49] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function storeCid(string calldata vin, string calldata cid, address recipient) external {
        require(bytes(vin).length == 17, "VIN must be 17 characters");
        require(bytes(cid).length > 0, "CID required");

        uint256 tokenId = _tokenIdFromVin(vin);
        bool isNewMint = _ownerOf(tokenId) == address(0);

        if (isNewMint) {
            require(msg.sender == minter, "Only minter can mint");
            require(recipient != address(0), "Recipient required");
        }

        if (isNewMint) {
            vinKeys.push(vin);
            tokenIdToVin[tokenId] = vin;
        }
        vinToCid[vin] = cid;

        if (isNewMint) {
            _safeMint(recipient, tokenId);
        }
        _setTokenURI(tokenId, string.concat("ipfs://", cid));

        emit CidStored(vin, cid, tokenId);

        if (isNewMint) {
            _payReward(recipient);
        }
    }

    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Minter required");
        emit MinterChanged(minter, newMinter);
        minter = newMinter;
    }

    function withdrawToken(IERC20 token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
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

    function versionTag() external pure returns (string memory) {
        return "v2-mock";
    }

    function setNewFeatureFlag(string calldata value) external onlyOwner {
        newFeatureFlag = value;
    }

    function _tokenIdFromVin(string memory vin) internal pure returns (uint256) {
        return uint256(keccak256(bytes(vin)));
    }

    function _payReward(address to) internal {
        if (address(rewardToken) == address(0) || rewardAmount == 0) return;
        try rewardToken.transfer(to, rewardAmount) {} catch {}
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
