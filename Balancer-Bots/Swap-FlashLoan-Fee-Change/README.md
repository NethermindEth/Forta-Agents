# Balancer Swap Fee & Flash Loan Fee Percentage Change Bot

## Description

This bot detects emissions of `SwapFeePercentageChanged` and `FlashLoanFeePercentageChanged` from the Balancer
`ProtocolFeesCollector` contract.

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-1-1
  - Fired when the swap fee is changed (i.e. `SwapFeePercentageChanged` is emitted)
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `newFeePercentage`: The new fee percentage value in %

- BAL-1-2
  - Fired when the flash loan fee is changed (i.e. `FlashLoanFeePercentageChanged` is emitted)
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `newFeePercentage`: The new fee percentage value in %

## Test Data
