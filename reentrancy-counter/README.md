# Reentrancy counter

## Description

This bot checks transactions for reentrancy by watching the call stack in a transaction's traces. It then reports the number of recurrent calls with its severity based on which threshold is reached and surpassed.

## Supported Chains

- Ethereum
- Optimism
- BNB Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

- NETHFORTA-25
  - Fired when multiple nested calls occur to the same contract in a transaction (Reentrancy)
  - The severity assigned depends on different call volume thresholds.
  - Type is always set to "suspicious"
  - The metadata includes:
  - `address`: The contract address reentered
  - `reentrancyCount`: A reentrancy counter based on how many times it occurred
  - `anomalyScore`: Score of how anomalous the alert is (0-1)
    - Score is calculated by finding amount of `NETHFORTA-25` alerts out of the total number of transactions that contained traces processed by this bot. This differs by chain.
  - Labels:
    - Label 1:
      - `entity`: The transaction's hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "Attack"
      - `confidence`: The confidence level of the transaction being an attack (0-1).
        - Confidence level calculated based on the Finding Severity:
          - Info -> 0.3, Low -> 0.4, Medium -> 0.5, High -> 0.6, Critical -> 0.7
    - Label 2:
      - `entity`: The reentered contract address
      - `entityType`: The type of the entity, always set to "Address"
      - `label`: The type of the label, always set to "Victim"
      - `confidence`^: The confidence level of the reentered contract being a victim (0-1).
        - Confidence level calculated based on the Finding Severity:
          - Info -> 0.3, Low -> 0.4, Medium -> 0.5, High -> 0.6, Critical -> 0.7
    - Label 3:
      - `entity`: The address of the initiator of the transaction
      - `entityType`: The type of the entity, always set to "Address"
      - `label`: The type of the label, always set to "Attacker"
      - `confidence`^: The confidence level of the transaction initiator being an attacker (0-1).
        - Confidence level calculated based on the Finding Severity:
          - Info -> 0.3, Low -> 0.4, Medium -> 0.5, High -> 0.6, Critical -> 0.7
