// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IVinCidRegistryMinimal {
    function storeCid(string calldata vin, string calldata cid, address recipient) external;
}

/// @title MaliciousReentrantReceiver
/// @notice Test-only. Reenters `VinCidRegistry.storeCid` from
///         `onERC721Received` during its own minting, to document (not fix)
///         the resulting divergence between `vinToCid` and the NFT's actual
///         `tokenURI` — see ADR 0020's Open Questions. Never deployed by
///         scripts/deploy.js.
contract MaliciousReentrantReceiver is IERC721Receiver {
    address public registry;
    string public reentrantVin;
    string public reentrantCid;
    bool public armed;

    function arm(address _registry, string calldata _vin, string calldata _cid) external {
        registry = _registry;
        reentrantVin = _vin;
        reentrantCid = _cid;
        armed = true;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        if (armed) {
            // Disarm first: this hook only fires once per mint, but guards
            // against any future accidental recursion regardless.
            armed = false;
            IVinCidRegistryMinimal(registry).storeCid(reentrantVin, reentrantCid, address(0));
        }
        return this.onERC721Received.selector;
    }
}
