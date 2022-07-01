// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

contract MockAsset {
    function balanceOf(address account) public view returns (uint256) {
        return (account == address(uint160(address(this)) + 1))? 1e18 : 0;
    }
}
