# Large QI Grant Agent

## Description

This agent detects large QI grants by monitoring `QiGranted` event logs in the
Comptroller contract.

The way a grant is classified as large can be modified in the `config.ts` file.

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
    - `mode`: The threshold mode defined in the agent configuration
    - `threshold`: The threshold value defined in the agent configuration

## Test Data (TODO)

The agent behaviour can be verified with the following transactions:
