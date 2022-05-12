# Role Changes Monitor Bot

## Description

This bot detects changes in roles in both the Safety Module and Liquidity Module contracts.

## Supported Chains

- Ethereum

## Alerts

- DYDX-18-1
  - Fired when a `RoleAdminChanged` event has been fired from either the Safety or Liquidity Module.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `role`: role that has changed.
    - `previousAdminRole`: admin role for `role` before being replaced.
    - `newAdminRole`: new admin role for `role` that replaced `previousadminRole`.

- DYDX-18-2
  - Fired when a `RoleGranted` event has been fired from either the Safety or Liquidity Module.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `role`: role that has been granted.
    - `account`: the account that has been granted the role.
    - `sender`: the account that originated the contract call.

- DYDX-18-3
  - Fired when a `RoleRevoked` event has been fired from either the Safety or Liquidity Module.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `role`: role that has been revoked..
    - `account`: the account that has been granted the role.
    - `sender`: the account that originated the contract call.