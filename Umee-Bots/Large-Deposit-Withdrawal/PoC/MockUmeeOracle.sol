// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

contract UmeeOracle {
    constructor() public {}

    function getAssetPrice(address asset) public view returns (uint256) {
        return 1 ether;
    }
}
