// SPDX-License-Identifier: agpl-3.0
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
    
    function mockBorrow(address account, uint256 collateral, uint256 debt, uint256 healthFactor) external {
        emit Borrow(address(0), account, account, 0, 0, 0, 0);

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
}
