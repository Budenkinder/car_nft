// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarRewardToken is ERC20, Ownable {
    constructor() ERC20("CarRewardToken", "CRT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000_000 * 10 ** decimals()); // 1 milliared CRT to contract owner
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
