# Role Change Detection Agent

## Description

This agent detects role changes in `AccessControl` contract.

## Supported Chains

- Ethereum
- Polygon
- BSC
- Avalanche
- Fantom
- Ropsten

## Alerts

- PARASWAP-2-1

  - Fired when `AccessControl` contract emits `RoleAdminChanged` event.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata fields:
    - `role`: Role whose admin role is replaced.
    - `previousAdminRole`: Previous admin role that is replaced with `newAdminRole`.
    - `newAdminRole`: New admin role that is set as `role`'s admin role.

- PARASWAP-2-2

  - Fired when `AccessControl` contract emits `RoleGranted` event.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata fields:
    - `role`: Role that is granted.
    - `account`: The account that is granted `role`.
    - `sender`: The account that originated the contract call.

- PARASWAP-2-2
  - Fired when `AccessControl` contract emits `RoleGranted` event.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata fields:
    - `role`: Role that is revoked.
    - `account`: The account that is revoked `role`.
    - `sender`: The account that originated the contract call.
