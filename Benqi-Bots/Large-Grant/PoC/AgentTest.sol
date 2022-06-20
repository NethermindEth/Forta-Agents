pragma solidity ^0.5.17;

import "https://github.com/Benqi-fi/BENQI-Smart-Contracts/blob/master/Governance/Qi.sol";
import "https://github.com/Benqi-fi/BENQI-Smart-Contracts/blob/master/Comptroller.sol";

contract AgentTest {
    Qi public testQi;
    Unitroller public testUnitroller;
    Comptroller public testComptroller;

    constructor () public {
        testQi = new Qi(address(this));
        testUnitroller = new Unitroller();
        testComptroller = new Comptroller();

        testUnitroller._setPendingImplementation(address(testComptroller));
        testComptroller._become(testUnitroller);
        
        address(testUnitroller).call(abi.encodeWithSignature("setQiAddress(address)", address(testQi)));
    }

    function grantQi(uint256 amount) internal {
        testQi.transfer(address(testUnitroller), amount);
        (bool success, ) = address(testUnitroller).call(
            abi.encodeWithSignature(
                "_grantQi(address,uint256)",
                address(msg.sender),
                amount
            )
        );
        require(success, "_grantQi call failed");
    }

    function testAbsoluteThreshold(uint256 threshold) external {
        grantQi(threshold);
    }

    function testPercentageTotalSupplyThreshold(uint256 threshold) external {
        uint256 qiAmount = testQi.totalSupply() * threshold / 100;
        grantQi(qiAmount);
    }

    function beforeTestPercentageComptrollerBalance() external {
        testQi.transfer(address(testUnitroller), 100 ether);
    }

    function testPercentageComptrollerBalance(uint256 threshold) external {
        uint256 qiAmount = testQi.balanceOf(address(testUnitroller)) * threshold / 100;
        grantQi(qiAmount);
    }
}
