// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;
import "./ITestToken.sol";

contract TestTarget {
    address private token;

    function setToken(address _token) external {
        token = _token;
    }

    function deposit(uint256 _amount) external {}

    // function that triggers a re-entrancy.
    function withdraw(uint256 _amount) external {
        ITestToken(token).transfer(address(this), msg.sender, _amount);
    }

    function emergencyWithdraw() external {}
}
