// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title NonStandardERC20Mock
/// @notice Test-only. Mimics non-compliant ERC-20s (e.g. legacy USDT) whose
///         `transfer` moves balances but returns no boolean, so that
///         VinCidRegistry.withdrawToken's `data.length == 0` branch — written
///         to support exactly this case — has real coverage. Never deployed
///         by scripts/deploy.js.
contract NonStandardERC20Mock {
    mapping(address => uint256) public balanceOf;

    constructor(uint256 initialSupply) {
        balanceOf[msg.sender] = initialSupply;
    }

    function transfer(address to, uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }
}
