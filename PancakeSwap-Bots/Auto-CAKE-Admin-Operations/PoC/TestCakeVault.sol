pragma solidity ^0.8.0;




contract CakeVault {

    event Pause();
    event Unpause();
    event Withdraw(address indexed sender, uint256 amount, uint256 shares);

    function oneEvent()public{
        emit Pause();
    }

    function twoEvents()public{
        emit Pause();
        emit Unpause();
    }

    function oneEventWrongEvent()public{
        emit Unpause();
        emit Withdraw(msg.sender, 10000, 200000);
    }

    function setAdmin(address _admin) public {

    }

    function setTreasury(address _treasury) public {

    }

    function setPerformanceFee(uint _performanceFee) public {

    }

    function setCallFee(uint _callFee) public {

    }

    function setWithdrawFee(uint _withdrawFee) public {

    }

}