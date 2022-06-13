// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.14;

contract MockGasUsed {
    uint256 public x = 0;

    function spendMidGas() public returns (uint256) {
        for (uint256 i = 0; i < 5000; i++) {
            x = i;
        }
        return x;
    }

    function spendHighGas() public returns (uint256) {
        for (uint256 i = 0; i < 12000; i++) {
            x = i;
        }
        return x;
    }

    function spendCriticalGas() public returns (uint256) {
        for (uint256 i = 0; i < 30000; i++) {
            x = i;
        }
        return x;
    }
}
