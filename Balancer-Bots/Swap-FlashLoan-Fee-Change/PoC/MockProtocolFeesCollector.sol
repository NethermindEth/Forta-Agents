pragma solidity ^0.7.0;

interface IProtocolFeesCollector {
  event SwapFeePercentageChanged(uint256 newSwapFeePercentage);
  event FlashLoanFeePercentageChanged(uint256 newFlashLoanFeePercentage);

  function setSwapFeePercentage(uint256 newSwapFeePercentage) external;
  function setFlashLoanFeePercentage(uint256 newFlashLoanFeePercentage) external;
}

contract MockProtocolFeesCollector is IProtocolFeesCollector {
  function setSwapFeePercentage(uint256 newSwapFeePercentage) override external {
    emit SwapFeePercentageChanged(newSwapFeePercentage);
  }

  function setFlashLoanFeePercentage(uint256 newFlashLoanFeePercentage) override external {
    emit FlashLoanFeePercentageChanged(newFlashLoanFeePercentage);
  }
  
  function test() external {
    emit SwapFeePercentageChanged(0.01e18);
    emit FlashLoanFeePercentageChanged(0.02e18);
  }
}
