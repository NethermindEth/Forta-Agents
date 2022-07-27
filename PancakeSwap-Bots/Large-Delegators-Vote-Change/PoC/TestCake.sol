pragma solidity ^0.8.0;

contract Cake{

    event DelegateVotesChanged(address indexed delegate, uint previousBalance, uint newBalance);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);


    function oneFinding() public{
        emit DelegateVotesChanged(address(0x1234), 25*(10**18), 50*(10**18));
    }

    function twoFindings() public{
        emit DelegateVotesChanged(address(0x1874), 10*(10**18), 65*(10**18));
        emit DelegateVotesChanged(address(0x0345), 2*(10**18), 3*(10**18));
    }

    function threeFindings() public{
        emit DelegateVotesChanged(address(0x0034), 45*(10**18), 100*(10**18));
        emit DelegateVotesChanged(address(0x0145), 30*(10**18), 50*(10**18));
        emit DelegateVotesChanged(address(0x5473), 8*(10**18), 10*(10**18));
    }

    function noFinding() public{
        emit DelegateChanged(address(0x2345), address(0x0231), address(0x0034));
    }

    function oneFindingAndMockEvent() public{
        emit DelegateVotesChanged(address(0x1234), 20*(10**18), 60*(10**18));
        emit DelegateChanged(address(0x2335), address(0x0131), address(0x2034));
    }

    function noThreshold() public {
        emit DelegateVotesChanged(address(0x0002), 21*(10**18), 25*(10**18));
    }

    function absoluteThreshold() public {
        emit DelegateVotesChanged(address(0x0003), 0, 101*(10**18));
    }

}