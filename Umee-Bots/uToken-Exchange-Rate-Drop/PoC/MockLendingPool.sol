// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {DataTypes} from "../libraries/types/DataTypes.sol";

contract LendingPool {
    function getReserveNormalizedIncome(address asset) external view virtual returns (uint256) {
        return 1 ether;
    }
}
