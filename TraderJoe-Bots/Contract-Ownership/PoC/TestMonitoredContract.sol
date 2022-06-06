pragma solidity >=0.6.0 <0.8.0;
// SPDX-License-Identifier: MIT

contract TestMonitoredContract {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function emitOwnershipTransferred(address _previousOnwer, address _newOnwer) external {
        emit OwnershipTransferred(_previousOnwer, _newOnwer);
    }
}