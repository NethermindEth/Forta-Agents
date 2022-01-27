// SPDX-License-Identifier: GPL-3
pragma solidity =0.7.6;

import './ImpossiblePair.sol';

contract ImpossibleSwapFactory {
    address public feeTo;
    address public governance;
    address public router;
    address public routerExtension;
    bool public whitelist;
    mapping(address => bool) public approvedTokens;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        bytes memory bytecode = type(ImpossiblePair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(tokenA, tokenB));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        allPairs.push(pair);
        emit PairCreated(tokenA, tokenB, pair, allPairs.length);
    }

    // Functions needed for other agents

    function setFeeTo(address _feeTo) external onlyGovernance {
        feeTo = _feeTo;
    }

    function setGovernance(address _governance) external override onlyGovernance {
        governance = _governance;
    }
}