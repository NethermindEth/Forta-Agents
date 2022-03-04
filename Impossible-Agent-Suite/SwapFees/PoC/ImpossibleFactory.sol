// SPDX-License-Identifier: GPL-3
pragma solidity =0.7.6;

import './ImpossiblePair.sol';

contract ImpossibleSwapFactory {
    mapping(address => mapping(address => address)) public getPair;

    event NewPair(address indexed pair);

    // not being monitored by the agent
    function createPair(address tokenA, address tokenB, uint8 fee, uint256 ratio) external returns (address pair) {
        bytes memory bytecode = type(ImpossiblePair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(tokenA, tokenB));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair;
        ImpossiblePair(pair).setData(tokenA, tokenB, fee, ratio);

        emit NewPair(pair);
        return pair;
    }
}
