// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

contract MockErc20 {
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    function approve(address spender, uint256 amount) public returns (bool) {
        emit Approval(msg.sender, spender, amount);
        return true;
    }
}

contract GovernanceEventsPoc {
    MockErc20 token;

    event PauseAction(bool supplyPaused, bool transferPaused, bool withdrawPaused, bool absorbPaused, bool buyPaused);
    event WithdrawReserves(address indexed to, uint amount);

    constructor() {
        token = new MockErc20();
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

    function approveThis(address manager, uint amount) external {
        token.approve(manager, amount);
    }
}
