# Ownership Transfer

## Description

This bot reports when the OwnershipTransferred event is emitted and the `from` address is a non zero address.

## Supported Chains

- Ethereum
- Optimism
- BNB Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

- NETHFORTA-4

  - Fired when OwnershipTransferred event is emitted when the `from` address is a non zero address
  - Severity is always set to "High".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `from`: The previous owner
    - `to`: The new owner
    - `anomalyScore`: Score of how anomalous the alert is (0-1)
  - Labels contain:
    - Label 1:
      - `entityType`: The type of the entity, always set to "Transaction"
      - `entity`: The transaction's hash
      - `label`: The type of the label, always set to "Attack"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 2:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: The tx initiator's address
      - `label`: The type of the label, always set to "Attacker"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 2:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Previous owner address
      - `label`: The type of the label, always set to "Victim"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 3:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: New owner address
      - `label`: The type of the label, always set to "Attacker"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`

## Test Data

The bot behaviour can be verified with the following command:

On Ethereum:

```
npm run tx 0x1e27044e3bfaba75ea95207e692da407ca325cb4c8a5602cb1943bf6cc0fd356
```
