# Detects Many Position Openings From An Account Within A Time-Frame.

## Description

Returns a finding for every time an account open many positions in a certain amount of time.

## Supported Chains

- Arbitrum
- Avalanche

## Alerts

- GMX-3
  - Fired when `IncreasePosition` event is emitted on `Vault` contract multiple time in a time-frame.
  - Severity is always set to "Medium".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `account`: User address account
    - `numberOfOpening`: The number of opened positions
