# Large BAL Token Transfer Bot

## Description

This bot detects transactions with large BAL transfers.

The thresholds can be set inside `src/agent.config.ts` file.

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-7
  - Fired when there is a large pool exit from a pool
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `from`: Account that transfers the token
    - `to`: Account that takes the token
    - `value`: Amount of transferred BAL token
    - `percentage`: Percentage of transferred BAL token relative to its total supply

## Test Data

For the tests, uncomment the lines indicated in `src/agent.config.ts`.

These tests can be run using `npm run block <BLOCK_NUMBER>` after setting the jsonRpcUrl in forta.config.json to an RPC of the network in question.

### Ethereum Mainnet

- `15013121` (1 finding)

### Polygon

- `29907924` (1 finding)

### Arbitrum

- `15516266` (2 findings)

### Kovan Testnet (PoC)

- `32334588` (1 finding)
