# Account inclusion and exclusion detection Bot

## Description

The bot returns a finding every time an account is included or excluded in the `GNANA` contract.

## Supported Chains

- Binance Smart Chain

## Alerts

- APESWAP-2-1
  - Fired when an `excludeAccount` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `token Address`: The address of the token contract.
    - `excluded Address`: The address that was excluded on the token contract.
- APESWAP-2-2
  - Fired when an `includeAccount` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `token Address`: The address of the token contract.
    - `included Address`: The address that was included on the token contract.

## Test Data

The bot behaviour can be verified with the following transaction:

- [0x11d9e51db542954972d988b1f4f45cdb3b29038bb41708d379ca7137352be037](https://bscscan.com/tx/0x11d9e51db542954972d988b1f4f45cdb3b29038bb41708d379ca7137352be037)
