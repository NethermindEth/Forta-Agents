# Ownership Transfer - Filecoin

## Description

This bot reports when the `OwnershipTransferred` event is emitted and the `from` address is a non zero address on Filecoin.

## Supported Chains

- Filecoin

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

On Filecoin:

```
npx forta-bot run --tx 0x3bb2f7b0b38f90b5f3cfb1905b560f125583c0b684a064daeb0a7da9f7dc31e0 --chainId 314
```
