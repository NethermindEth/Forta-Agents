// SPDX-License-Identifier: GPL-3.0
// deployed at mumbai https://kovan.etherscan.io/address/0x19d7085288bd7130fe67a6ee58ecfbe7005c5e9f
pragma solidity 0.7.0;


contract Vault{
event DecreasePosition(bytes32 key,address account,address collateralToken,address indexToken,uint256 collateralDelta,uint256 sizeDelta,bool isLong,uint256 price,uint256 fee);
function manyDecreasePositions() external {  
for(uint i = 0; i <50; i++){
emit DecreasePosition( 0x8637fa101169e83385804a3f0a78a217f4d0b17a07beefd838a039238444e37e,
        address(this),
        address(this),
        address(this),
        1,
        1,
        true,
        1,
        1);
}
}
}
