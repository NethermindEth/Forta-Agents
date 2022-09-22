// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IToken {
    function setBalanceOf(
        address _address,
        uint _amount
    ) external returns (bool status);
}

contract MockHubPool {
    
    address public l1Token;
    uint public l1TokenAmount;
    uint public lpTokensToMint;
    uint public l1TokensToReturn;
    uint public lpTokenAmount;
    IToken public l1;

    event LiquidityRemoved(
        address indexed l1Token,
        uint256 amount,
        uint256 lpTokensBurnt,
        address indexed liquidityProvider
    );

    function setValues(address _l1Token, uint _l1TokenAmount, uint _l1TokensToReturn, uint _lpTokenAmount) external {
        l1Token = _l1Token;
        l1TokenAmount = _l1TokenAmount;
        l1TokensToReturn = _l1TokensToReturn;
        lpTokenAmount = _lpTokenAmount;
        l1 = IToken(l1Token);
    }

    function emitRemoveLiquidity(address tokenAdd, uint amount) public {
        l1.setBalanceOf(tokenAdd, amount);
        emit LiquidityRemoved(l1Token, l1TokensToReturn, lpTokenAmount, msg.sender);
    }

}