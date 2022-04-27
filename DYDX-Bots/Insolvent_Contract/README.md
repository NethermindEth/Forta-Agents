# Insolvent Contract Bot

## Description

This bot detects when the contract is insolvent. Insolvency is refers to when `totalBorrowerDebtBalance` is greater than `totalActiveBalanceCurrentEpoch`. The checks for both variables in every block.

## Supported Chains

- Ethereum

## Alerts

- DYDX-15
  - Fired when `totalBorrowerDebtBalance` is greater than `totalActiveBalanceCurrentEpoch`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `totalBorrowerDebtBalance`: The total debt balance owed by borrowers.
    - `totalActiveBalanceCurrentEpoch`: The current epoch's total active balance.

## Test Data

The bot behaviour can be verified with the following contracts:

[0x4aaAF7a1a829b2130AF2Ec7A4A4F5FEd27D8eD1F](https://kovan.etherscan.io/address/0x4aaAF7a1a829b2130AF2Ec7A4A4F5FEd27D8eD1F) - `TestImplemenation`.

[0xe9511Faa2B2ccE548A5999b4bC3772e6a0f1C14A](https://kovan.etherscan.io/address/0xe9511Faa2B2ccE548A5999b4bC3772e6a0f1C14A) - `TestProxy`.

You can test it with this specific block [31286275](https://kovan.etherscan.io/block/31286275). Alternatively, you can use the setter functions in the `testProxy` contract to toggle both `totalBorrowerDebtBalance` and `totalActiveBalanceCurrentEpoch` to test them in real time. This is because the bot checks these values in every block.