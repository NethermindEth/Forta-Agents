# Token Transfer Re-entrancy bot

## Description

This bot detects re-entrancy in `StableJoeStaking`, `MasterChefJoeV2` , `MoneyMaker` and all of `Joetroller` markets, considering the risk of token transfer callbacks.

## Supported Chains

- Avalanche

## Alerts

- TraderJoe-25

  - Fired when a call to one of the functions involving a transfer is detected. And another call to the same contract is made.
  - Severity is always set to "High"
  - Type is always set to "Exploit"
  - Metadata contains:
    - `from`: the address source making the second call to the contract.
    - `initialCall`: selector of the function that was initially called.
    - `reEntrantCall`: selector of the function that was called in the re-entrancy case.
  - addresses contains the address of the contract where the re-entrancy happened.

## Test Data
