// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "./MockAsset.sol";

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

contract MockLendingPool {
    event Borrow(
        address indexed reserve,
        address user,
        address indexed onBehalfOf,
        uint256 amount,
        uint256 borrowRateMode,
        uint256 borrowRate,
        uint16 indexed referral
    );

    address constant internal MOCK_ASSET_1 = 0x1721B1C0dD86F7FC06d27646DBd30c058ce86D28;
    address constant internal MOCK_ASSET_2 = 0x9D5975017B0B5378d8A760494699E82521e6B61d;
    uint256 constant internal RATIO_THRESHOLD = 505;
    uint256 constant internal RATIO_THRESHOLD_DECIMALS = 1000;

    function absoluteThreshold(uint256 tvl) internal pure returns (uint256) {
        return tvl * RATIO_THRESHOLD / RATIO_THRESHOLD_DECIMALS;
    }

    function assetUToken(address asset) internal pure returns (address) {
        return address(uint160(asset) + 1);
    }

    function getReserveData(address asset) external pure returns (ReserveData memory reserveData) {
        reserveData.uTokenAddress = assetUToken(asset);
    }

    function test1() public {
        uint256 tvl1 = MockAsset(MOCK_ASSET_1).balanceOf(assetUToken(MOCK_ASSET_1));
        uint256 tvl2 = MockAsset(MOCK_ASSET_2).balanceOf(assetUToken(MOCK_ASSET_2));
        
        uint256 threshold1 = absoluteThreshold(tvl1);
        uint256 threshold2 = absoluteThreshold(tvl2);

        // shouldn't result in a finding
        emit Borrow(MOCK_ASSET_1, address(0x1), address(0x2), threshold1 - 1, 0, 0, 0);

        // should result in a finding
        emit Borrow(MOCK_ASSET_2, address(0x1), address(0x2), threshold2, 0, 0, 0);
    }

    function test2() public {
        uint256 tvl1 = MockAsset(MOCK_ASSET_1).balanceOf(assetUToken(MOCK_ASSET_1));
        uint256 tvl2 = MockAsset(MOCK_ASSET_2).balanceOf(assetUToken(MOCK_ASSET_2));
        
        uint256 threshold1 = absoluteThreshold(tvl1);
        uint256 threshold2 = absoluteThreshold(tvl2);

        // should result in a finding
        emit Borrow(MOCK_ASSET_1, address(0x1), address(0x2), threshold1, 0, 0, 0);

        // should result in a finding
        emit Borrow(MOCK_ASSET_2, address(0x1), address(0x2), threshold2 + 1, 0, 0, 0);
    }
}
