// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;
import "./ITestToken.sol";

contract TestMarket {
    address private token;

    function setToken(address _token) external {
        token = _token;
    }

    // function that triggers a re-entrancy.
    function mint(uint256 mintAmount) external returns (uint256) {
        ITestToken(token).mint(mintAmount);
    }

    function mintNative() external payable returns (uint256) {
        return 0;
    }
}
