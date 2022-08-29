//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

struct RelayData {
    uint256 amount;
    uint256 totalFilledAmount;
    uint256 fillAmount;
    uint256 repaymentChainId;
    uint256 originChainId;
    uint256 destinationChainId;
    uint64 relayerFeePct;
    uint64 appliedRelayerFeePct;
    uint64 realizedLpFeePct;
    uint32 depositId;
    address destinationToken;
    address relayer;
    address depositor;
    address recipient;
    bool isSlowRelay;
}

contract TestHubPool{
    event FilledRelay(uint256 amount, uint256 totalFilledAmount, uint256 fillAmount, uint256 repaymentChainId, uint256 originChainId, uint256 destinationChainId, uint64 relayerFeePct, uint64 appliedRelayerFeePct, uint64 realizedLpFeePct, uint32 depositId, address destinationToken, address indexed relayer, address indexed depositor, address recipient, bool isSlowRelay);

    function emitEvent(
        uint256 _amount,
        uint256 chainId,
        uint64 feePct,
        uint32 _depositId,
        address _addr
    ) public
    {
        RelayData memory relayData = RelayData({
            amount : _amount,
            totalFilledAmount : _amount,
            fillAmount : _amount,
            repaymentChainId : chainId,
            originChainId : chainId,
            destinationChainId : chainId,
            relayerFeePct : feePct,
            appliedRelayerFeePct : feePct,
            realizedLpFeePct: feePct,
            depositId: _depositId,
            destinationToken: _addr,
            relayer: _addr,
            depositor: _addr,
            recipient: _addr,
            isSlowRelay: false
        });

        _emitSingleEvent(relayData);
    }
    
    function _emitSingleEvent(RelayData memory relay) internal
    {
        emit FilledRelay(
            relay.amount,
            relay.totalFilledAmount,
            relay.fillAmount,
            relay.repaymentChainId,
            relay.originChainId,
            relay.destinationChainId,
            relay.relayerFeePct,
            relay.appliedRelayerFeePct,
            relay.realizedLpFeePct,
            relay.depositId,
            relay.destinationToken,
            relay.relayer,
            relay.depositor,
            relay.recipient,
            relay.isSlowRelay
        );
    }
}