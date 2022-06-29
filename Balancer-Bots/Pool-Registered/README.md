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

These tests can be run using `npm run block <BLOCK_NUMBER>` after setting `jsonRpcUrl` in `forta.config.json` to an
`RPC` of the network in question.

### Ethereum Mainnet

- `15008557` (1 finding - `PoolRegistered` was emitted)

### Polygon

- `29858567` (1 finding - `PoolRegistered` was emitted)

### Arbitrum

- `15409034` (1 finding - `PoolRegistered` was emitted)

### Kovan Testnet (PoC)

> The PoC files are available at `PoC/`.

- `32320180` (3 findings - `PoolRegistered` was emitted 3 times with different parameters)
