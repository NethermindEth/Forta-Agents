# Instant Withdrawals

## Description

This bot queries the top 10 investors of every V2 Yearn Vault and checks how much of their shares can be withdrawn instantly.

## Supported Chains

- Ethereum

## Alerts

- YEARN-7
  - Fired at least every 6 hours.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - The metadata contains:
    - `vault`: The vault analyzed.
    - `totalSupply`: Total supply of vault shares.
    - `sharesOwnedByTop10`: Amount of shares owned by the Top 10 investors.
    - `shareAvailableToWithdrawByTop10`: Amount of shares the Top 10 investors were able to withdraw instantly.
    - `minPercentAvailableToWithdrawn`: A lower limit for the percent of the share's total supply that can be instantly withdrawn.
