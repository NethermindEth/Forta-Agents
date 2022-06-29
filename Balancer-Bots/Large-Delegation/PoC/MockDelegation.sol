pragma solidity ^0.7.0;
import { DelegateRegistry } from "https://github.com/gnosis/delegate-registry/blob/main/contracts/DelegateRegistry.sol";

contract MockERC20 {
    mapping(address => uint256) private _balances;
    uint256 constant public totalSupply = 1000;

    function setBalanceOf(address account, uint256 balance) public {
        _balances[account] = balance;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
}

contract MockDelegation {
    MockERC20 public veBAL;
    DelegateRegistry public delegateRegistry;

    constructor () {
        veBAL = new MockERC20();
        delegateRegistry = new DelegateRegistry();
    }

    function test0() public {
        veBAL.setBalanceOf(address(this), 0);

        // should not emit a finding
        delegateRegistry.setDelegate(bytes32("balancer.eth"), address(1));
    }

    function test1() public {
        veBAL.setBalanceOf(address(this), 100);

        // should emit an absolute threshold finding
        delegateRegistry.setDelegate(bytes32("balancer.eth"), address(2));
    }

    function test2() public {
        veBAL.setBalanceOf(address(this), 200);

        // should emit both absolute and supply percentage threshold findings
        delegateRegistry.setDelegate(bytes32("balancer.eth"), address(3));
    }
}
