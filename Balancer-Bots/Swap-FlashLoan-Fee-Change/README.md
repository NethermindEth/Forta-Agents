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

These tests can be run using `npm run block <BLOCK_NUMBER>` after setting the `jsonRpcUrl` in `forta.config.json` to an RPC of the network in question.

> Obs.: There wasn't any case in which `FlashLoanFeePercentageChanged` was emitted, so the following tests are only related to `SwapFeePercentageChanged`.

### Ethereum Mainnet

- `14250148` (1 finding - `SwapFeePercentageChanged` was emitted)

### Polygon

- `25025173` (1 finding - `SwapFeePercentageChanged` was emitted)

### Arbitrum

- `6203674` (1 finding - `SwapFeePercentageChanged` was emitted)

### Kovan Testnet (PoC)

- `32203465` (1 finding - `MockProtocolFeesCollector.setFlashLoanFeePercentage()`)
  - Related to `MockProtocolFeesCollector.setFlashLoanFeePercentage()`
  - 1 finding - `SwapFeePercentageChanged` was emitted with the value `1` (1e-16 %)
- `32203467`
  - Related to `MockProtocolFeesCollector.setSwapFeePercentage()`
  - 1 finding - `SwapFeePercentageChanged` was emitted with the value `2` (2e-16 %)
- `32203470`
  - Related to `MockProtocolFeesCollector.test()`
  - 2 findings - `SwapFeePercentageChanged` was emitted with the value `0.01e18` (1 %) and `FlashLoanFeePercentageChanged` was emitted with the value `0.02e18` (2 %)
