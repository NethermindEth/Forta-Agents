// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PglStakingContract {

    // Current contract admin address
    address public admin;


    // Sum of all supplied PGL tokens
    uint256 public totalSupplies;

    constructor() {
        admin = msg.sender;
    }

    // deposit and redeem functions simplified.

    function deposit(uint256 pglAmount) external {
        require(pglAmount > 0, "Zero deposit");
        totalSupplies = totalSupplies + pglAmount;
    }

    function redeem(uint256 pglAmount) external  {
         require(pglAmount < totalSupplies, "Large amount");
        totalSupplies = totalSupplies - pglAmount;
    }

    /**
     * Fallback function to accept AVAX deposits.
     */
    fallback() external {

    }
}