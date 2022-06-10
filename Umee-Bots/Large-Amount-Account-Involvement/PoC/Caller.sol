// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.14;

contract Test {
    function setX(uint256) public returns (uint256) {}
}

contract Caller {
    Test testContract;

    address[] addresses = [
        0xb0ac18ad229cc882BD3D7028fbA8561Fa304263c,
        0xD869561245ce0DEbf949881438274540141E1B9f,
        0xD869561245ce0DEbf949881438274540141E1B9f,
        0x5603D85c0883E26df723E1814935CbD7A58Ef896,
        0x32c74973F23b6F5a03A44A2f5e96aa60bd9e30f0,
        0x2888BfDfa432554DED56feba834C4A9D1C82A1eb,
        0x15018d625562f5823164D988639f62D1bc8c92a0,
        0x1d427289eDf1e20aE4c27ae19b3Da99b34B61DE3,
        0x9eB644FAE6b761095dC16668eB79a44F959d2416,
        0x4b4A9B7f171F6512A3a3085d8FE355183D1E176F
    ];

    function setX(uint256 _val) public {
        for (uint256 i = 0; i < addresses.length; i++) {
            testContract = Test(addresses[i]);
            testContract.setX(_val);
        }
    }
}
