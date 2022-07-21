// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

contract TestToken {
    mapping(address => uint256) balances;
    string public symbol;

    constructor(string memory _symbol) {
        symbol = _symbol;
    }

    function setBalanceOf(address account, uint256 balance) external {
        balances[account] = balance;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}

contract TestVault {
    TestToken private _token0;
    TestToken private _token1;

    constructor() {
        TestToken token0;
        TestToken token1;

        token0 = new TestToken("MockToken1");
        token1 = new TestToken("MockToken2");

        token0.setBalanceOf(address(this), 200000000000000);
        token1.setBalanceOf(address(this), 200000000000000);

        _token0 = token0;
        _token1 = token1;
    }

    // Monitored events.
    event InternalBalanceChanged(address indexed user, address indexed token, int256 delta);

    function changeInternalBalance() external {
        address token0 = address(_token0);
        address token1 = address(_token1);
        emit InternalBalanceChanged(address(this), token0, 11000000000000);
        emit InternalBalanceChanged(address(this), token1, -21000000000000);
    }
}
