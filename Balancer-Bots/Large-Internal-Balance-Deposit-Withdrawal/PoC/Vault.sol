// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

contract TestVault {
    // Monitored events.
    event InternalBalanceChanged(address indexed user, address indexed token, int256 delta);

    function changeInternalBalance(
        address user,
        address token,
        int256 delta
    ) external {
        emit InternalBalanceChanged(user, token, delta);
    }
}
