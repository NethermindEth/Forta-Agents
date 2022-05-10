# Large Borrower Allocation Bot

## Description

This bot detects when a borrower's allocation is high. The bot listens to `ScheduledBorrowerAllocationChange` event emissions, and if the `newAllocation` exceeds the `threshold`, it creates a finding.
> The static threshold can be adjusted by changing `THRESHOLD` in `utils.ts`. 

## Supported Chains

- Ethereum

## Alerts

- DYDX-16
  - Fired when `ScheduledBorrowerAllocationChange` event is emitted with a `newAllocation` that exceeds the threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `borrower`: Address of borrower.
    - `oldAllocation`: Previous allocation of borrower.
    - `newAllocation`: New allocation of borrower.
    - `epochNumber`: Current epoch number.
  - Addresses is the address from which the event was emitted.

## Test Data
> Note: Bot has to be tested with the Kovan testnet, otherwise it will fail with this test data.

The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0x9670277EcB0b56f52E113c9c3833681d2Af7d253](https://kovan.etherscan.io/address/0x9670277ecb0b56f52e113c9c3833681d2af7d253) - `TestProxy`.

[0x9FEF477a7e6cA08E60192e42016E99eF0DE6F2C9](https://kovan.etherscan.io/address/0x9FEF477a7e6cA08E60192e42016E99eF0DE6F2C9) - `TestImplementation`.

To test specific event emissions, use the following transactions on the Kovan ETH testnet:

[0x0c5539f947e36fc83a7e5a52f819039888116a3aedc804207dffd040e96a3c98](https://kovan.etherscan.io/tx/0x0c5539f947e36fc83a7e5a52f819039888116a3aedc804207dffd040e96a3c98) - `ScheduledBorrowerAllocationChange` event.
