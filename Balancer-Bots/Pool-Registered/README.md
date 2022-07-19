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

These tests can be run using `npm run tx <TX_HASH>` after setting `jsonRpcUrl` in `forta.config.json` to an
`RPC` of the network in question.

### Ethereum Mainnet

- `0x7511b813ce248e94c6f785a8cc0fd15cfaf465b6710a76ea2242dc3424d30f0e` (1 finding - `PoolRegistered` was emitted)

### Polygon

- `0xd1c936d6aac05de39ae0185ac2da92fd253accf54827f7e72e8b3ed617d606a7` (1 finding - `PoolRegistered` was emitted)

### Arbitrum

- `0xad36063c130dbbb95bafbedd24a4eb0bc80bfb738a390f878c23df8210f1ef2a` (1 finding - `PoolRegistered` was emitted)

### Kovan Testnet (PoC)

> The PoC files are available at `PoC/`.

- `0x0fe99dce954be9e0a7b69cdfa8add5a7ccec86ec345a6f50fdd71e79867a1f74` (3 findings - `PoolRegistered` was emitted 3 times with different parameters)
