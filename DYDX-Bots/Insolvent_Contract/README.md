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