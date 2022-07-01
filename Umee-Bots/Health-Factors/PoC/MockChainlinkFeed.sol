// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockChainlinkFeed {
    function latestAnswer() external pure returns (int256) {
        return 2000e8;
    }
}
