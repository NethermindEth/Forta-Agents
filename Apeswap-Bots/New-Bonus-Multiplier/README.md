# MasterApe's BONUS_MULTIPLIER parameter changes detection bot

## Description

The bot returns a finding when the farm parameter `BONUS_MULTIPLIER` is changed in Apeswap's `MasterApe` contract.

## Supported Chains

- Binance Smart Chain

## Alerts

- APESWAP-10
  - Fired when an `updateMultiplier` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `MasterApe`: The address of the contract.
    - `New Bonus Multiplier`: The new bonus multiplier parameter.

## Test Data

The agent behaviour can be verified with the following transactions on **BSC testnet** (PoC):

- [0xd6c0099081d5ad411e3de54597c3ecf732416b03e50891fa040604508bbe36b1](https://testnet.bscscan.com/tx/0xd6c0099081d5ad411e3de54597c3ecf732416b03e50891fa040604508bbe36b1)
