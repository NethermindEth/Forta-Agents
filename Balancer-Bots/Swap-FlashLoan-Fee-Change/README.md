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

  - Fired when the flash loan fee is changed (i.e. `FlashLoanFeePercentageChanged` is emitted)
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `newFeePercentage`: The new fee percentage value in %

- BAL-1-2
  - Fired when the swap fee is changed (i.e. `SwapFeePercentageChanged` is emitted)
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `newFeePercentage`: The new fee percentage value in %

## Test Data

These tests can be run using `npm run tx <TRANSACTION_HASH>` after setting the `jsonRpcUrl` in `forta.config.json` to an RPC of the network in question.

### Ethereum Mainnet

> Obs.: There wasn't any case in which `FlashLoanFeePercentageChanged` was emitted, so the following tests are only related to `SwapFeePercentageChanged`.

- `0xc421ff8642bdeb12dd0776015e1e7bcaa6c7430970c9079a14f2c2463d22c437` (1 finding - `SwapFeePercentageChanged` was emitted)

### Polygon

> Obs.: There wasn't any case in which `FlashLoanFeePercentageChanged` was emitted, so the following tests are only related to `SwapFeePercentageChanged`.

- `0x0e5d2108213e1670284340e05e9621dcd3061e66b53d7910d8e2dd4186abd8ec` (1 finding - `SwapFeePercentageChanged` was emitted)

### Arbitrum

> Obs.: There wasn't any case in which `FlashLoanFeePercentageChanged` was emitted, so the following tests are only related to `SwapFeePercentageChanged`.

- `0x6f428f4ddd9741df8fed61f282ba54e7173aad8e5c317799457f46e4bee27e9b` (1 finding - `SwapFeePercentageChanged` was emitted)

### Kovan Testnet (PoC)

> The PoC files are available at `PoC/`.

In order to run the tests below, uncomment the indicated lines in `src/agent.config.ts`.

- `0x91eb37edbfe87c58c8c61067e3e5f2678411139a49c8b4d6490875dda4ca3a57`
  - Related to `MockProtocolFeesCollector.setFlashLoanFeePercentage()`
  - 1 finding - `FlashLoanFeePercentageChanged` was emitted with the value `1` (1e-16 %)
- `0xe871fcd1abe72c47e9e096926267cd74e5256303dbdc57f2e5e62d3224e7cd0c`
  - Related to `MockProtocolFeesCollector.setSwapFeePercentage()`
  - 1 finding - `SwapFeePercentageChanged` was emitted with the value `2` (2e-16 %)
- `0x4daa92ace3ba7dbbdd93c22e918b299289c9f85b17c42e15979f35b9d090eacc`
  - Related to `MockProtocolFeesCollector.test()`
  - 2 findings - `SwapFeePercentageChanged` was emitted with the value `0.01e18` (1 %) and `FlashLoanFeePercentageChanged` was emitted with the value `0.02e18` (2 %)
