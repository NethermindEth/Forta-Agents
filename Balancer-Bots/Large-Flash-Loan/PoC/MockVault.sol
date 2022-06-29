
pragma solidity ^0.7.0;

contract MockERC20 {
    mapping(address => uint256) private _balances;

    function setBalanceOf(address account, uint256 balance) public {
        _balances[account] = balance;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
}

contract MockVault {
    MockERC20 private _token0;
    MockERC20 private _token1;

    event FlashLoan(address indexed recipient, address indexed token, uint256 amount, uint256 feeAmount);

    constructor () {
        MockERC20 token0;
        MockERC20 token1;

        token0 = new MockERC20();
        token1 = new MockERC20();

        token0.setBalanceOf(address(this), 10000);
        token1.setBalanceOf(address(this), 100);

        _token0 = token0;
        _token1 = token1;
    }

    function test() public {
        address token0 = address(_token0);
        address token1 = address(_token1);

        // considering the threshold is 50.5%
        emit FlashLoan(address(0), token0, 5051, 0); // should emit finding
        emit FlashLoan(address(0), token0, 5050, 0); // should emit finding
        emit FlashLoan(address(0), token0, 5049, 0); // should not emit finding

        emit FlashLoan(address(0), token1, 51, 0); // should emit finding
        emit FlashLoan(address(0), token1, 50, 0); // should not emit finding
    }
}
