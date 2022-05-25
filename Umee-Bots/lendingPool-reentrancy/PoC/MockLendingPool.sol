pragma solidity 0.6.12;
// Deployed on https://kovan.etherscan.io/address/0x094e1340a1d0f8Db9BbBA9C0cE541A22ACDa15ef
contract MockLendingPool {
    struct Deposits {
        address asset;
        uint256 amount;
        address onBehalfOf;
        uint16 referralCode;
    }
    address[] deposits;

    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) public payable {
        require(msg.value > 0, 'deposite more than zero');
        deposits.push(msg.sender);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) public payable {
        payable(address(to)).call{value: 0.000001 ether}('');
    }
}
