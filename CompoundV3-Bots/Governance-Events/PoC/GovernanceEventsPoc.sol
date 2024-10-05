// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

contract MockTimelock {
    event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta);
    event QueueTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta);

    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        emit QueueTransaction(txHash, target, value, signature, data, eta);
    }

    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        emit ExecuteTransaction(txHash, target, value, signature, data, eta);
    }

    function queueApproveThis(address comet, address manager, address asset, uint amount) external {
        queueTransaction(comet, 0, "approveThis(address,address,uint256)", abi.encode(manager, asset, amount), 0);
    }

    function executeApproveThis(address comet, address manager, address asset, uint amount) external {
        executeTransaction(comet, 0, "approveThis(address,address,uint256)", abi.encode(manager, asset, amount), 0);
    }
}

contract GovernanceEventsPoc {
    MockTimelock immutable timelock;

    event PauseAction(bool supplyPaused, bool transferPaused, bool withdrawPaused, bool absorbPaused, bool buyPaused);
    event WithdrawReserves(address indexed to, uint amount);

    constructor() {
        timelock = new MockTimelock();
    }

    function pause(
        bool supplyPaused,
        bool transferPaused,
        bool withdrawPaused,
        bool absorbPaused,
        bool buyPaused
    ) external {
        emit PauseAction(supplyPaused, transferPaused, withdrawPaused, absorbPaused, buyPaused);
    }

    function withdrawReserves(address to, uint amount) external {
        emit WithdrawReserves(to, amount);
    }
}
