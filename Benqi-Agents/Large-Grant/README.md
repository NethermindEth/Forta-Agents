# Large QI Grant Agent

## Description

This agent detects large QI grants by monitoring `QiGranted` event logs in the
Comptroller contract.

## Supported Chains

- Avalanche

## Alerts

- BENQI-4
  - Fired when there's a large QI grant.
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - `recipient`: Address of the grant recipient
    - `amount`: Amount granted

## Test Data (TODO)

The agent behaviour can be verified with the following transactions:
