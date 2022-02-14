# Keeper Topup Monitor

## Description

This agent detects when keepers are running out of balance

## Supported Chains

- Polygon

## Alerts

Describe each of the type of alerts fired by this agent

- PICKLE-7-1
  - Fired when a `performUpkeep` is called on the desginated `keeper` and its balance is very close to minimum balance.
  - Severity is always set to "High".
  - Type is always set to "Info".
  - Metadata contains: 
    - `remainingCalls`: Estimated calls that keeper will be able to perform without running out of balance.
    - `balance`: Actual keeper balance.

- PICKLE-7-2
  - Fired when a `performUpkeep` is called on the desginated `keeper` and its balance is close to minimum balance.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `remainingCalls`: Estimated calls that keeper will be able to perform without running out of balance.
    - `balance`: Actual keeper balance.
