# Detects Many Position Openings From An Account Within A Time-frame. 

## Description

Returns a finding for every time an account open many position in a certain amount of time .

## Supported Chains

- Arbitrum
- Avalanche

## Alerts

- GMX-3
  - Fired when `IncreasePosition` event is emitted on `Vault` contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `account`: User address account
