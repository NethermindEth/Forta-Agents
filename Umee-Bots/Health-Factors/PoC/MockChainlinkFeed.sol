// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockChainlinkFeed {
    function latestAnswer() external pure returns (int256) {
        return 200_000_000_000;
    }
}
