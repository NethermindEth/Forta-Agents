//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

contract ERC20{
    event Transfer(address indexed from, address indexed to, uint256 value);

    function emitEvent(address from, address to, uint value) public
    {
        emit Transfer(from, to, value);
    }
}