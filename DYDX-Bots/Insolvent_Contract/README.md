# Insolvent Contract Bot

## Description

This bot detects when the contract is insolvent. Insolvency refers to when the difference between `totalBorrowerDebtBalance` and `totalActiveBalanceCurrentEpoch` is greater than a set static threshold. The bot checks for both variables in every block.

> Note: To set the static threshold to a desired amount, update the value of `THRESHOLD_AMOUNT` in `utils.ts`. Currently, it is set to `0`, and thus will detect **any** difference between the two varibles.

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
> Note: Bot has to be tested with the Kovan testnet, otherwise it will fail with this test data.

The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0x4aaAF7a1a829b2130AF2Ec7A4A4F5FEd27D8eD1F](https://kovan.etherscan.io/address/0x4aaAF7a1a829b2130AF2Ec7A4A4F5FEd27D8eD1F) - `TestImplemenation`.

[0xe9511Faa2B2ccE548A5999b4bC3772e6a0f1C14A](https://kovan.etherscan.io/address/0xe9511Faa2B2ccE548A5999b4bC3772e6a0f1C14A) - `TestProxy`.

You can test the bot on the Kovan ETH testnet by running `npm start`. Also, you can use the setter functions in the `testProxy` contract to toggle both `totalBorrowerDebtBalance` and `totalActiveBalanceCurrentEpoch` to test them in real time. This is because the bot checks these values in every block.