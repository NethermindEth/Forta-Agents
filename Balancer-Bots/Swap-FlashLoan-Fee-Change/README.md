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

These tests can be run using `npm run tx <TX_HASH>` after setting the `jsonRpcUrl` in `forta.config.json` to an RPC of the network in question.

> Obs.: There wasn't any case in which `FlashLoanFeePercentageChanged` was emitted, so the following tests are only related to `SwapFeePercentageChanged`.

### Ethereum Mainnet

- `0xc421ff8642bdeb12dd0776015e1e7bcaa6c7430970c9079a14f2c2463d22c437` (1 finding - `SwapFeePercentageChanged` was emitted)

### Polygon

- `0x0e5d2108213e1670284340e05e9621dcd3061e66b53d7910d8e2dd4186abd8ec` (1 finding - `SwapFeePercentageChanged` was emitted)

### Arbitrum

- `0x6f428f4ddd9741df8fed61f282ba54e7173aad8e5c317799457f46e4bee27e9b` (1 finding - `SwapFeePercentageChanged` was emitted)
