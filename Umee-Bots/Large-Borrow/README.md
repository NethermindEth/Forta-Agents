# Large Borrow Bot

## Description

This bot detects transactions with large borrows in the Umee protocol.
The bot's behavior can be customized by editing the configuration fields in
`src/agent.config.ts`.

## Supported Chains

- Ethereum

## Alerts

- UMEE-6
  - Fired when a transaction contains a "large" borrow
  - Severity is always set to "unknown"
  - Type is always set to "info"
  - Metadata:
    - `amount`: Amount borrowed
    - `tvlPercentage`: % of pool TVL that was borrowed
    - `user`: Address that initiated the borrow
    - `onBehalfOf`: Address that acquired the debt

## Test Data


