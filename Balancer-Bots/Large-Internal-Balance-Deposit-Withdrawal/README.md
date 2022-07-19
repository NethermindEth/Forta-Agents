# Large Internal Balance Change Bot

## Description

This bot detects large internal balance changes (i.e. any of the tokens' Vault balance relative to the balance in the
previous block is above a set threshold) in the Balancer protocol.

The thresholds can be set inside `src/agent.config.ts` file.

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-2-1

  - Fired when there is a large withdrawal from a user's internal balance
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `user`: The account that withdraws the tokens
    - `token`: The withdrawn token address
    - `delta`: The amount the balance decreased

- BAL-2-2
  - Fired when there is a large deposit to a user's internal balance
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `user`: The account that deposits the tokens
    - `token`: The deposited token address
    - `delta`: The amount the balance increased

## Test Data

For the tests, uncomment the lines indicated in `src/agent.config.ts`.

These tests can be run using `npm run tx <TRANSACTION_HASH>` after setting the jsonRpcUrl in forta.config.json to an RPC of the network in question.

### Ethereum Mainnet

- `0xda361ac6d1f63470f92bdbc6d8d57d94d828532fcfbb0cf803ec1963abed3ec9` (1 finding - Deposit)
- `0x4414be85bc7a499da546c5b788ef2de8c97020dc0b1fdb629bafe0baf1e19ee5` (1 finding - Withdrawal)

### Polygon

- `0x0c41faec233229bb6539dc408b8d99c2eaacc0f7163c28bdbe0cabc77b89dba5` (1 finding - Deposit)

### Arbitrum

- `0xfc6fb79feb61089e0f32b74e64f8ee74ba23f846a4dafe53554bd8cd260f32b4` (1 finding - Withdrawal)

### Kovan Testnet (PoC)

- `0x64237e15f186e593374d2364d81b9612d72d391fe3d8d701afcbd104fd1224c8` (1 finding - Deposit)
- `0x9c19a3c42d1af7ba8db87f0106641d94d2f7eaf9f28388b45add43c0cab3cda6` (1 finding - Withdrawal)
