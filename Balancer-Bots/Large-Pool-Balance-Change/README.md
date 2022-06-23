# Large Internal Balance Change Bot

## Description

This bot detects large pool balance changes (i.e. any of the tokens' pool balance relative to the amount in the
previous block is above a set threshold) in the Balancer protocol.

The thresholds can be set inside `src/agent.config.ts` file.

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-5-1

  - Fired when there is a large pool exit from a pool
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `poolId`: ID of the pool
    - `previousBalance`: Balance before pool exit
    - `token`: Address of the token taken away from the pool
    - `delta`: Token amount taken away from the pool
    - `percentage`: Percentage of token taken away from the pool relative to previous balance

- BAL-5-2

  - Fired when there is a large deposit to a user's internal balance
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `poolId`: ID of the pool
    - `previousBalance`: Balance before pool join
    - `token`: Address of the token put into the pool
    - `delta`: Token amount put into the pool
    - `percentage`: Percentage of token put into the pool relative to previous balance

## Test Data

For the tests, uncomment the lines indicated in `src/agent.config.ts`.

These tests can be run using `npm run block <BLOCK_NUMBER>` after setting the jsonRpcUrl in forta.config.json to an RPC of the network in question.

### Ethereum Mainnet

- `15001362` (1 finding - Join)
- `15003789` (2 findings - Exit)

### Polygon

- `29896975` (2 findings - Exit)

### Arbitrum

- `15453346` (2 findings - Join-Exit)

### Kovan Testnet (PoC)

- `32322862` (1 finding - Join)
- `32322874` (1 finding - Exit)
