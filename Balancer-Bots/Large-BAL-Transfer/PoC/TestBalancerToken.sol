// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract TestBalancerToken {
    uint256 internal _totalSupply = 50000000000000000000000000;

    event Transfer(address indexed from, address indexed to, uint256 value);

    function transfer(
        address sender,
        address recipient,
        uint256 amount
    ) external virtual {
        emit Transfer(sender, recipient, amount);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
}
