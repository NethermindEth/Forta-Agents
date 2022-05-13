# Changes in the farm parameter BONUS_MULTIPLIER detection bot

## Description

The bot returns a finding when the farm parameter BONUS_MULTIPLIER is changed.

## Supported Chains

- Binance Smart Chain

## Alerts

- APESWAP-11
  - Fired when an `updateMultiplier` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `Contract Address`: The address of the contract.
    - `New Bonus Multiplier`: The new bonus multiplier parameter.
