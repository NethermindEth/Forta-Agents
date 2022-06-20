// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestComptroller {
    address[] public allMarkets;

    function getAllMarkets() public view returns (address[] memory) {
        return allMarkets;
    }

    function addMarket(address market) public {
        allMarkets.push(market);
    }
}
