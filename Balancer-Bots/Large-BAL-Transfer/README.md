# Large BAL Token Transfer Bot

## Description

This bot detects transactions with large BAL transfers. Minimum percentage token transfer amount relative to BAL total supply in that network that leads to a finding. 

The thresholds can be set inside `src/agent.config.ts` file. Threshold set to 5%. 

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-7
  - Fired when there is a large pool exit from a pool
  - Severity is always set to "Low"
  - Type is always set to "Info"
  - Metadata:
    - `from`: Account that transfers the token
    - `to`: Account that takes the token
    - `value`: Amount of transferred BAL token
    - `percentage`: Percentage of transferred BAL token relative to its total supply

## Test Data

For the tests, uncomment the lines indicated in `src/agent.config.ts`.

These tests can be run using `npm run tx <TX_HASH>` after setting the jsonRpcUrl in forta.config.json to an RPC of the network in question.

### Ethereum Mainnet

- `0x17cfbfd6386f91895341b224757ed0cb8660b374a28ba79dd1afa00ecef6d547` (1 finding)

### Polygon

- `0x78bdcd28277e7d7b1c2b6d9976845abbd133d8acee11d7c732b264cbe045dc70` (1 finding)

### Arbitrum

- `0x26fb04469593b03962f50f02215ec8a427ce1f88aeb02f0aae27e3f2a8707a83` (2 findings)

### Kovan Testnet (PoC)

- `0xcb0536104e900c9690676ff2669c723039f07ac85479eca843f8be747cc36ee5` (1 finding)
