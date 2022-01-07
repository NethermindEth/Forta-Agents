# OlympusDAO totalReserves Monitor

## Description

This agent detects big changes in treasury contract `totalReserves`.
> Contract: 0x31F8Cc382c9898b273eff4e0b7626a6987C846E8

## Supported Chains

- Ethereum

## Alerts

- olympus-treasury-3-1
  - Fired when a big `totalReserves` increasement is detected
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `totalReserves`: Previous totalReserves value
    - `changedTo`: New totalReserves value
    - `increasedBy`: Text indicating the increasement percent

- olympus-treasury-3-2
  - Fired when a big `totalReserves` decreasement is detected
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `totalReserves`: Previous totalReserves value
    - `changedTo`: New totalReserves value
    - `decreasedBy`: Text indicating the decreasement percent

## Test Data

The agent behaviour can be verified with the following transaction:

- 0xe2543fd41fe316b4b0b43b37a74e290b7bfbcc7821749c56249c8a2c6e0594e0 (value increasement)
