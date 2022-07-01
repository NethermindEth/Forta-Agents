// SPDX-License-Identifier: MIT
import "./ITestTarget.sol";

pragma solidity >=0.7.0 <0.9.0;

// token with a call back
interface ITestToken {
    function transfer(
        address from,
        address to,
        uint256 _amount
    ) external;

    function mint(uint256 _amount) external;
}
