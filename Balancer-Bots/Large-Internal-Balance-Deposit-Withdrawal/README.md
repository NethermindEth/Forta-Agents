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

These tests can be run using `npm run block <BLOCK_NUMBER>` after setting the jsonRpcUrl in forta.config.json to an RPC of the network in question.

### Ethereum Mainnet

- `14994480` (1 finding - Deposit)
- `14994486` (1 finding - Withdrawal)

### Polygon

- `29785779` (1 finding - Deposit)

### Arbitrum

- `15100962` (1 finding - Withdrawal)

### Kovan Testnet (PoC)

- `32229387` (1 finding - Deposit)
- `32229410` (1 finding - Withdrawal)
