pragma solidity 0.6.12;
// Deployed https://kovan.etherscan.io/address/0x9109c02d40ba02ccc6ed3436404ab2bc7bb707f7
contract MockLendingPool {
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) public payable {
        // making a reentrant call to withdraw()
        MockLendingPool(address(this)).withdraw(address(0x0), 0, address(0x0));
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) public payable {
        // no-op
    }

    function test() public {
        deposit(address(0x0), 0, address(0x0), 0);
    }
}