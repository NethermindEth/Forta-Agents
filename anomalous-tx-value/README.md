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
    - `anomalyScore`: Score of how anomalous the alert is (0-1)
      - Score calculated by finding the amount of anomalous value transactions detected by the bot out of the total amount of transactions that have a `value` greater than zero.
  - Label
    - `entityType`: The type of the entity, always set to "Transaction"
    - `entity`: The transaction's hash
    - `label`: The type of the label, always set to "High Value Transaction"
    - `confidence`: The confidence level of the address being an attacker (0-1). Always set to `1`
