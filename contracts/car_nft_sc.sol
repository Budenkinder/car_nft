// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title VinCidRegistry
/// @notice One NFT per VIN. The tokenURI points at the latest IPFS CID for the
///         car's repair history. Only wallets holding `ORG_ROLE` (approved
///         organizations) may mint new VIN NFTs or update an existing record;
///         the NFT is assigned to a `recipient` argument supplied by the
///         caller — typically the car owner's wallet. `ORG_ROLE` is granted
///         and revoked by `DEFAULT_ADMIN_ROLE`, held by the contract deployer
///         (see ADR 0035 — a Safe/multisig admin was considered and dropped).
/// @dev Upgradeable via UUPS behind an `ERC1967Proxy` (see ADR 0028) so that
///      registered VIN/CID data survives future logic upgrades instead of
///      resetting on every redeploy. Any future version of this contract must
///      only APPEND new state after `__gap` (shrinking it accordingly) — never
///      reorder or remove the fields below, or an upgrade will corrupt storage.
///      `AccessControlUpgradeable` uses ERC-7201 namespaced storage, so it
///      does not consume sequential slots from `__gap` (verified in
///      test/VinCidRegistry.upgrade.test.js).
contract VinCidRegistry is
    Initializable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    mapping(string => string) private vinToCid;
    mapping(uint256 => string) private tokenIdToVin;
    string[] private vinKeys;

    IERC20 public rewardToken;
    uint256 public rewardAmount;

    /// @notice Deprecated (ADR 0035). Retained only for storage-layout
    ///         compatibility across the upgrade — no longer read by any code
    ///         path. Access is governed by `ORG_ROLE` instead; see `initializeV2`.
    address public minter;

    /// @notice Held by any wallet approved to mint or update VIN records.
    ///         Granted/revoked by `DEFAULT_ADMIN_ROLE` (the contract deployer).
    bytes32 public constant ORG_ROLE = keccak256("ORG_ROLE");

    /// @notice Declared for ADR 0030's future verifier concept. Unused today —
    ///         no function checks this role yet (decision 2026-08-03-004).
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    event CidStored(string vin, string cid, uint256 tokenId);
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event ApplicationSubmitted(address indexed applicant, uint256 timestamp);

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
    }

    /// @notice ADR 0035 migration. Callable exactly once, any time after
    ///         `initialize`. Bootstraps the role model: `admin` becomes
    ///         `DEFAULT_ADMIN_ROLE` (able to grant/revoke `ORG_ROLE`), and the
    ///         incumbent `minter` is granted `ORG_ROLE` so it keeps working
    ///         without a separate manual grant.
    function initializeV2(address admin) public reinitializer(2) {
        __AccessControl_init();
        require(admin != address(0), "Admin required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORG_ROLE, minter);
    }

    /// @notice Mint a new car NFT (first call for a VIN) or update the CID on
    ///         an existing one. Both mints and updates are gated to `ORG_ROLE`
    ///         and the NFT is assigned to `recipient` on a new mint.
    /// @param vin       17-character VIN.
    /// @param cid       IPFS CID for the metadata JSON. Stored as `ipfs://<cid>`.
    /// @param recipient Wallet that receives the NFT on a new mint. Ignored
    ///                  on updates (pass `address(0)` if you like — it isn't read).
    function storeCid(string calldata vin, string calldata cid, address recipient) external {
        require(bytes(vin).length == 17, "VIN must be 17 characters");
        require(bytes(cid).length > 0, "CID required");
        require(hasRole(ORG_ROLE, msg.sender), "Not an approved organization");

        uint256 tokenId = _tokenIdFromVin(vin);
        bool isNewMint = _ownerOf(tokenId) == address(0);

        if (isNewMint) {
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

    /// @notice ADR 0037. Callable by any wallet, including one with no role —
    ///         an org-registration applicant has none yet. Emits only the
    ///         caller's address and the block timestamp; no application
    ///         content or hash of it is ever accepted or stored (decision
    ///         2026-08-03-002). Gives the applicant a real, mined transaction
    ///         to reference in their application email as a stronger proof
    ///         than `personal_sign` alone: it shows the wallet can actually
    ///         transact on this network, not just sign a message.
    function submitApplication() external {
        emit ApplicationSubmitted(msg.sender, block.timestamp);
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
    ///      contract owner. `ORG_ROLE` (mint/update authority) and `owner`
    ///      (upgrade authority) remain distinct.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @dev Required override: both `ERC721URIStorageUpgradeable` and
    ///      `AccessControlUpgradeable` declare `supportsInterface`.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorageUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Storage gap: reserved slots so a future upgrade can append new state
    // variables above without shifting the layout of the fields declared
    // above. Shrink this array (never remove it entirely) as fields are added.
    uint256[50] private __gap;
}
