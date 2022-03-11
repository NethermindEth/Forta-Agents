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

- PARASWAP-2
  - Fired when `AccessControl` contract emits `RoleAdminChanged`, `RoleGranted`, `RoleRevoked` events.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata fields when `RoleAdminChanged` event is emitted
    - `role`: Role whose admin role is replaced.
    - `previousAdminRole`: Previous admin role that is replaced with `newAdminRole`.
    - `newAdminRole`: New admin role that is set as `role`'s admin role.
  - Metadata fields when `RoleGranted` and `RoleRevoked` events are emitted
    - `role`: Role that is granted or revoked.
    - `account`: The account that is granted or revoked `role`.
    - `sender`: The account that originated the contract call.
