// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockToken {
    mapping(address => uint) balances;

    function setBalanceOf(address account, uint balance) external returns (bool) {
        balances[account] = balance;
        return true;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}