// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract QiToken {
    /**
     * @notice Borrow interest rate at the current timestamp
     */
    uint256 public borrowInterestRatePerTimestamp;

    /**
     * @notice Supply interest rate at the current timestamp
     */
    uint256 public supplyInterestRatePerTimestamp;

    /**
     * @notice Returns the current per-timestamp borrow interest rate for this qiToken
     * @return The borrow interest rate per timestmp, scaled by 1e18
     */
    function borrowRatePerTimestamp() external view returns (uint256) {
        return borrowInterestRatePerTimestamp;
    }

    /**
     * @notice Returns the current per-timestamp supply interest rate for this qiToken
     * @return The supply interest rate per timestmp, scaled by 1e18
     */
    function supplyRatePerTimestamp() external view returns (uint256) {
        return supplyInterestRatePerTimestamp;
    }

    /**
     * @notice Custom function to set the current borrow rate per timestamp
     */
    function setBorrowRatePerTimestamp(uint256 rate) external {
        borrowInterestRatePerTimestamp = rate;
    }

    /**
     * @notice Custom function to set the current supply rate per timestamp
     */
    function setSupplyRatePerTimestamp(uint256 rate) external {
        supplyInterestRatePerTimestamp = rate;
    }
}
