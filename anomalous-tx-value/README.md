# Detect anomalous Transaction Value

## Description

This bot detects transactions with anomalous transaction value (i.e. value greater than a threshold).

The thresholds can be set inside `src/agent.config.ts` file.

## Supported Chains

- Ethereum
- Optimism
- BNB Smart Chain
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
