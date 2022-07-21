# Large Internal Balance Change Bot

## Description

This bot detects large pool balance changes (i.e. any of the tokens' pool balance relative to the amount in the
previous block is above a set threshold) in the Balancer protocol. Minimum percentage token amount relative to the Vault's token balance set to threshold: "40" // 40%

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

These tests can be run using `npm run tx <TRANSACTION_HASH>` after setting the jsonRpcUrl in forta.config.json to an RPC of the network in question.

### Ethereum Mainnet

- `0x7dd832377f97f3d3988c308b056c036d2637feedd449ac6a115917b6692e0453` (1 finding - Join)
- `0xcb526222a151f1b9327a7b14c25ced17a8125186ff695307b024c02b9442f622` (2 findings - Exit)

### Polygon

- `0xfeb5abaf453ae024a8f102a4646c599c54c3066990e590985817356bdbadb27e` (2 findings - Exit)

### Arbitrum

- `0xe0f46f4384c850be7149b1cdd509e8a8417e0dc1412cd56341b33e7e119b469c` (2 findings - Join-Exit)

### Kovan Testnet (PoC)

- `0x496bb4aee9120eaab67a8a637fc984a67c46ae9ade2ecb523dcab17e4c67d74a` (1 finding - Join)
- `0x0d5b3b6c51b9d21205f7127352a9fb924fbf67b3046cc46f3d21f40e85781b22` (1 finding - Exit)
