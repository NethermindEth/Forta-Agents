# Balancer Pool Registered Agent Hot

## Description

This bot detects pool registrations in the Balancer protocol by listening to `PoolRegistered` events emitted by the
`Vault` contract.

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-6
  - Fired when a pool registration is detected
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `poolId`: The pool's ID
    - `poolAddress`: The pool's address
    - `specialization`: The pool's specialization (`"GENERAL"`, `"MINIMAL_SWAP_INFO"` or `"TWO_TOKEN"`)

## Test Data
