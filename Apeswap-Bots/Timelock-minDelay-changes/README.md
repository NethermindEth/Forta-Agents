# Timelock min delay monitoring bot

## Description

This bot detects changes to `_minDelay` on Apeswap's `TimelockV2Secure` and `TimelockV2General` contracts.

## Supported Chains

- BNB Smart Chain

## Alerts

- APESWAP-11
  - Fired when `MinDelayChange` event is emitted on either `TimelockV2Secure` or `TimelockV2General` contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `oldDuration`: Previous min delay duration
    - `newDuration`: New min delay duration

## Test Data

The bot behaviour can be verified with the following transaction:

- [0xad70e258234a5f3a6537841957bae1bdbeec672ac27b4443b008b91825de3d14](https://bscscan.com/tx/0xad70e258234a5f3a6537841957bae1bdbeec672ac27b4443b008b91825de3d14)
