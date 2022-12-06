# Detect anomalous Transaction Value

## Description

This agent detects transactions with anomalous Transaction Value (i.e. value greater than the `TX_VALUE_THRESHOLD`).

The thresholds can be set inside `src/agent.config.ts` file.

## Supported Chains

- Ethereum
- Optimism
- Binance Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

- NETHFORTA-2
  - Fired when a transaction has higher value than the threshold
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata:
    - `value`: Value of the transaction
