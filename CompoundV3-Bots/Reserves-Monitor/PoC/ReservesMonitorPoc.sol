// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

contract ReservesMonitorPoc {
    uint256 public constant targetReserves = 10e18;
    int256 internal _reserves;

    constructor () {
        _reserves = int256(targetReserves - 1);
    }

    function getReserves() external view returns (int256) {
        return _reserves;
    }

    function setReservesToTarget() external {
        _reserves = int256(targetReserves);
    }
}
