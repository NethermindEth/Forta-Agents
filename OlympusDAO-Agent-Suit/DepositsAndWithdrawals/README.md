# OlympusDAO Treasury High Deposit/Withdrawals

## Description

This agent detects transactions with high Deposit/Withdrawals values in OlympusDAO Treasury contract
> Contract: 0x31f8cc382c9898b273eff4e0b7626a6987c846e8

## Supported Chains

- Ethereum

## Alerts

- olympus-treasury-5-1
  - Fired when a high deposit occurs
  - Severity is always set to "info" 
  - Type is always set to "suspicious" 
  - Metadata contains:
    - `token`: Address of the deposited token
    - `amount`: Amount of tokens deposited
    - `value`: Value in OHM

- olympus-treasury-5-2
  - Fired when a high withdrawal occurs
  - Severity is always set to "info" 
  - Type is always set to "suspicious" 
  - Metadata contains:
    - `token`: Address of the token withdrawn
    - `amount`: Amount of withdrawn token
    - `value`: Value in OHM
