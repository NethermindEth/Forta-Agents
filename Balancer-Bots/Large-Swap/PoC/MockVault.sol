
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

    event Swap(bytes32 indexed poolId, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    constructor () {
        MockERC20 token0;
        MockERC20 token1;

        token0 = new MockERC20();
        token1 = new MockERC20();

        token0.setBalanceOf(address(this), 100);
        token1.setBalanceOf(address(this), 10);

        _token0 = token0;
        _token1 = token1;
    }

    function test() public {
        address token0 = address(_token0);
        address token1 = address(_token1);

        emit Swap("\x00", token0, token1, 51, 0); // should emit a finding
        emit Swap("\x01", token0, token1, 50, 0); // should emit a finding
        emit Swap("\x02", token0, token1, 49, 0); // should not emit a finding

        emit Swap("\x03", token0, token1, 0, 6); // should emit a finding
        emit Swap("\x04", token0, token1, 0, 5); // should emit a finding
        emit Swap("\x05", token0, token1, 0, 4); // should not emit a finding

        emit Swap("\x06", token0, token1, 50, 5); // should emit a finding
    }
}
