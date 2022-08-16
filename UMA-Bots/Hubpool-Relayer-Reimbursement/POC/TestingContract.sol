//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;


contract TestingContract {
    event TokensRelayed(address l1Token, address l2Token, uint256 amount, address to);
    event FakeEvent(address, address, uint, address);
    event Transfer(address, uint);

    function emitSingleEvent() public
    {
        emit TokensRelayed(0x1Abf3a6C41035C1d2A3c74ec22405B54450f5e13, 0x5aDF576358c64d33C61378876cbfA342aff9a5D4, 1291290, 0x4D9079Bb4165aeb4084c526a32695dCfd2F77381);
    }

    function emitMultipleEvents() public
    {
        emit TokensRelayed(0x236BF03FFa1BcA2fAd10c1A8d0699502902E8a4A, 0xF559D091D6d94a45442Dd56ad6294FA1C7cac7AC, 1291290, 0x4D9079Bb4165aeb4084c526a32695dCfd2F77381);
        emit TokensRelayed(0x981F022D9c87D8EAA33634eDc520FC5F3B5d8747, 0xDC2C794EfE257Bc413349649Aaf477Ca17874c16, 1291290, 0x4D9079Bb4165aeb4084c526a32695dCfd2F77381);
        emit FakeEvent(0x6a32082B393044CEA0df2c23d8702d5C22491fAd, 0xE4c47018c301782994CBe6c66aa0e8b85b419f31, 12, 0xE4c47018c301782994CBe6c66aa0e8b85b419f31);
        emit Transfer(0xFD185254C2D8dC6e2DAc7bFfe76C33ceDFA24d3d, 46920);
    }
}