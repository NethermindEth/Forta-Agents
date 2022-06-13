// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

struct ReserveConfigurationMap {
    uint256 data;
}

struct ReserveData {
    ReserveConfigurationMap configuration;
    uint128 liquidityIndex;
    uint128 variableBorrowIndex;
    uint128 currentLiquidityRate;
    uint128 currentVariableBorrowRate;
    uint128 currentStableBorrowRate;
    uint40 lastUpdateTimestamp;
    address uTokenAddress;
    address stableDebtTokenAddress;
    address variableDebtTokenAddress;
    address interestRateStrategyAddress;
    uint8 id;
}

contract MockERC20 {
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;

    function setBalanceOf(address account, uint256 balance) public {
        _balances[account] = balance;
    }

    function setTotalSupply(uint256 totalSupply) public {
        _totalSupply = totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
}

contract MockLendingPool {
    address[] private reserves;
    mapping(address => ReserveData) private reserveData;

    function createMockReserve(
        uint256 underlyingAssetBalance,
        uint256 stableDebtTokenSupply,
        uint256 variableDebtTokenSupply
    ) internal returns (address) {
        MockERC20 asset = new MockERC20();
        address uToken = address(uint160(address(asset)) + 1);

        MockERC20 stableDebtToken = new MockERC20();
        MockERC20 variableDebtToken = new MockERC20();

        ReserveData storage data = reserveData[address(asset)];
        data.uTokenAddress = uToken;
        data.stableDebtTokenAddress = address(stableDebtToken);
        data.variableDebtTokenAddress = address(variableDebtToken);

        reserves.push(address(asset));

        setReserveBalances(
            address(asset),
            underlyingAssetBalance,
            stableDebtTokenSupply,
            variableDebtTokenSupply
        );

        return address(asset);
    }

    function setReserveBalances(
        address reserve,
        uint256 underlyingAssetBalance,
        uint256 stableDebtTokenSupply,
        uint256 variableDebtTokenSupply
    ) internal {
        ReserveData storage data = reserveData[reserve];

        MockERC20(reserve).setBalanceOf(data.uTokenAddress, underlyingAssetBalance);
        MockERC20(data.stableDebtTokenAddress).setTotalSupply(stableDebtTokenSupply);
        MockERC20(data.variableDebtTokenAddress).setTotalSupply(variableDebtTokenSupply);
    }

    function test1() public {
        createMockReserve(5, 10, 10); // 0.8
    }

    function test2() public {
        createMockReserve(10, 100, 10); // ~0.917
        createMockReserve(10, 100, 100); // ~0.952

        // so reserves.length is 11
        for (uint256 i = 0; i < 8; i++) {
            createMockReserve(5, 10, 10); // 0.8
        }
    }

    function test3() public {
        setReserveBalances(reserves[0], 5, 10, 35); // 0.9
        setReserveBalances(reserves[1], 10, 100, 10); // ~0.917
        setReserveBalances(reserves[2], 1000, 100, 100); // ~0.167
    }

    function getReservesList() external view returns (address[] memory) {
        return reserves;
    }

    function getReserveData(address asset) external view returns (ReserveData memory) {
        return reserveData[asset];
    }
}
