// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract PglStakingContract {
    using SafeMath for uint256;

    // Current contract admin address
    address public admin;


    // Sum of all supplied PGL tokens
    uint256 public totalSupplies;

    constructor() {
        admin = msg.sender;
    }

    // deposit and redeem functions simplified.

    function deposit(uint256 pglAmount) external {
        require(pglAmount > 0, "Zero deposit");
        totalSupplies = totalSupplies.add(pglAmount);
    }

    function redeem(uint256 pglAmount) external  {
         require(pglAmount < totalSupplies, "Large amount");
        totalSupplies = totalSupplies.sub(pglAmount);
    }

    /**
     * Fallback function to accept AVAX deposits.
     */
    fallback() external {

    }
        modifier adminOnly {
        require(msg.sender == admin, "admin only");
        _;
    }
}
