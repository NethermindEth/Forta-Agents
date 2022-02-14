# Pickle Finance Vaults PPS monitor

## Description

This agent detects decreasements in the Pickle Finance Vaults.
> Vaults are fetched on-chain from PickleRegistry at 0xF7C2DCFF5E947a617288792e289984a2721C4671

## Supported Chains

- Ethereum

## Alerts

- pickle-5-1
  - Fired when a increasement is detected in a Pickle Finance Vault
  - Severity is always set to "High"
  - Type is always set to "Suspicious"
  - Metadata contains:
    - `vault`: Address of the vault with anomalous PPS
    - `ratio`: The current PPS value of the vault
    - `oldRatio`: The previous PPS value of the vault

- pickle-5-2
  - Fired when a decreasement is detected in a Pickle Finance Vault
  - Severity is always set to "High"
  - Type is always set to "Suspicious"
  - Metadata contains:
    - `vault`: Address of the vault with anomalous PPS
    - `ratio`: The current PPS value of the vault
    - `oldRatio`: The previous PPS value of the vault
