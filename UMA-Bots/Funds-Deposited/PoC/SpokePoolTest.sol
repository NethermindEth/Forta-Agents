pragma solidity ^0.8.0;

contract SpokePool {

    event FundsDeposited(uint256 amount, uint256 originChainId, uint256 destinationChainId, uint64 relayerFeePct,uint32 indexed depositId, uint32 quoteTimestamp,address indexed originToken, address recipient,address indexed depositor);
    event SetDepositQuoteTimeBuffer(uint32 newBuffer);

    function oneFinding() external{
        emit FundsDeposited(1000000, 1, 123, 555, 2, 123456789, address(0x9898), address(0x5546), address(0x6453) );
    }

    function twoFindings() external {
        emit FundsDeposited(1000000, 1, 123, 555, 2, 123456789, address(0x9898), address(0x5546), address(0x6453) );
        emit FundsDeposited(3000000, 2, 444, 77, 8, 18794, address(0x1118), address(0x9a46), address(0x1053) );

    }

    function oneFindingOneWrongEvent() external {
        emit FundsDeposited(1000000, 1, 123, 555, 2, 123456789, address(0x9898), address(0x5546), address(0x6453) );
        emit SetDepositQuoteTimeBuffer(222);
    }

}