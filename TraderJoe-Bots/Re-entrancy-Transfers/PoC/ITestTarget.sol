// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface ITestTarget {
    function deposit(uint256 _amount) external;

    function withdraw(uint256 _amount) external;

    function emergencyWithdraw() external;

    function mint(uint256 mintAmount) external returns (uint256);

    function mintNative() external payable returns (uint256);
}
