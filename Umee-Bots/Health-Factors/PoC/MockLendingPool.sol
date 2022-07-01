// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

contract MockLendingPool {
    struct AccountData {
        uint256 totalCollateralETH;
        uint256 totalDebtETH;
        uint256 availableBorrowsETH;
        uint256 currentLiquidationThreshold;
        uint256 ltv;
        uint256 healthFactor;
    }

    event Borrow(
        address indexed reserve,
        address user,
        address indexed onBehalfOf,
        uint256 amount,
        uint256 borrowRateMode,
        uint256 borrowRate,
        uint16 indexed referral
    );

    mapping(address => AccountData) accountData;
    mapping(address => bool) borrowed;
    
    function mockBorrow(address account, uint256 collateral, uint256 debt, uint256 healthFactor) public {
        if (!borrowed[account]) {
            emit Borrow(address(0), account, account, 0, 0, 0, 0);
        }

        accountData[account] = AccountData({
            totalCollateralETH: collateral,
            totalDebtETH: debt,
            availableBorrowsETH: 0,
            currentLiquidationThreshold: 0,
            ltv: 0,
            healthFactor: healthFactor
        });
    }

    function getUserAccountData(address user) external view returns (
      uint256 totalCollateralETH,
      uint256 totalDebtETH,
      uint256 availableBorrowsETH,
      uint256 currentLiquidationThreshold,
      uint256 ltv,
      uint256 healthFactor
    ) {
        AccountData memory ad = accountData[user];

        return (
            ad.totalCollateralETH,
            ad.totalDebtETH,
            ad.availableBorrowsETH,
            ad.currentLiquidationThreshold,
            ad.ltv,
            ad.healthFactor
        );
    }

    function usdToEth(uint256 usd) internal pure returns (uint256) {
        return (usd * 1e18) / 2000;
    }

    function generateTestingData1() external {
        mockBorrow(address(1), usdToEth(1000), usdToEth(1), 10e18);
        mockBorrow(address(2), usdToEth(2000001), usdToEth(1), 10e18);
        mockBorrow(address(3), usdToEth(2000001), usdToEth(21), 10e18);
        mockBorrow(address(4), usdToEth(2000001), usdToEth(21), 1e18);
    }

    function generateTestingData2() external {
        mockBorrow(address(3), usdToEth(2000001), usdToEth(21), 1e18);
    }
}
