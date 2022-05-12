pragma solidity ^0.6.2;

import "https://github.com/ApeSwapFinance/apeswap-golden-banana/blob/main/contracts/GoldenBanana.sol";

contract TestGoldenBanana is GoldenBanana {
    constructor(uint256 initialSupply) public GoldenBanana(initialSupply) {}
}
