// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

contract TestVault {
    event PoolBalanceChanged(
        bytes32 indexed poolId,
        address indexed liquidityProvider,
        address[] tokens,
        int256[] deltas,
        uint256[] protocolFeeAmounts
    );

    address[] tokens = [
        0x1C8E3Bcb3378a443CC591f154c5CE0EBb4dA9648,
        0x41286Bb1D3E870f3F750eB7E1C25d7E48c8A1Ac7
    ];
    uint256[] balances = [1000000000000000000000000, 2000000000000000000000000];
    uint256[] protocolFeeAmounts = [1, 2];
    int256[] deltasJoin = [400000000000000000000001, 10000000000000000000001];
    int256[] deltasExit = [20000000000000000000001, -820000000000000000000001];
    bytes32 poolId =
        0xf33a6b68d2f6ae0353746c150757e4c494e02366000200000000000000000117;
    address liquidityProvider = msg.sender;

    function getPoolTokens(bytes32 _poolId)
        external
        view
        returns (
            address[] memory,
            uint256[] memory,
            uint256
        )
    {
        return (tokens, balances, 32322788);
    }

    function joinPool() external {
        emit PoolBalanceChanged(
            poolId,
            liquidityProvider,
            tokens,
            deltasJoin,
            protocolFeeAmounts
        );
    }

    function exitPool() external {
        emit PoolBalanceChanged(
            poolId,
            liquidityProvider,
            tokens,
            deltasExit,
            protocolFeeAmounts
        );
    }
}
