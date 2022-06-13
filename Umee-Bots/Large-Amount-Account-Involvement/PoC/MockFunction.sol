// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.14;

contract Test {
    uint256 public x = 1;

    function setX(uint256 _x) public returns (uint256) {
        x = _x;
        return x;
    }
}
