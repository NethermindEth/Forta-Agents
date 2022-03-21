pragma solidity >= 0.5.0;

interface ITestCallee {
    function testCall(address sender, uint amount0, uint amount1, bytes calldata data) external;
}