# Stake Contract SetAdjustment 

## Description

This agent detects calls to `SetAdjustment` function on stake contract.
> 0xc58e923bf8a00e4361fe3f4275226a543d7d3ce6

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- OlympusDAO-5
  - Fired `setAdjustment` is called on stake contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - In the metadata field you can find:
    - `_index`: Value of the `_index` argument in the call.
    - `_add`: Value of the `_add` argument in the call.
    - `_rate`: Value of the `_rate` argument in the call.
    - `_target`: Value of the `_target` argument in the call.

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x32586931cd30c20717e94021b47d1383f8d7b55321927799c5a7aec9aca83681
