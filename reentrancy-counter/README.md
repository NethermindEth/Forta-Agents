# Reentrancy counter

## Description

This bot checks transactions for reentrancy. This is done by the bot watching the call stack in transaction traces. It then reports the number of recurrent calls with varying severity based on various thresholds. Additionally, it includes trace call paths leading to each reentrancy's deepest call in the stack for each path.

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
  - Fired when multiple nested calls occur to the same contract in a transaction with call depths greater than 2 levels from the root call path (Reentrancy)
  - It reports all possible severities based on different call volume thresholds.
  - Type is always set to "suspicious"
  - The metadata includes:
  - `address`: The contract address where the reentrancy occurred
  - `reentrancyCount`: A reentrancy counter based on how many times it occurred
  - `anomalyScore`: Score of how anomalous the alert is (0-1)
    - Score calculated by finding amount of either `NETHFORTA-25` alerts out of the total number of transactions that contained traces processed by this bot and differs based on chain.
  - `traceAddresses` : A string representation of each path of reentrancy, where each path ends at the deepest call to the contract along the same call path and from the same root call. Note that calls on a reentrancy path that are within the threshold of depth from the root call will be displayed, but not counted towards the total reentrancy count.
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

## Test Data

The bot behaviour can be verified with the following transactions:

- [0xa6f63fcb6bec8818864d96a5b1bb19e8bd85ee37b2cc916412e720988440b2aa](https://etherscan.io/tx/0xa6f63fcb6bec8818864d96a5b1bb19e8bd85ee37b2cc916412e720988440b2aa) (Orion Protocol Exploit)
- [0xa9a1b8ea288eb9ad315088f17f7c7386b9989c95b4d13c81b69d5ddad7ffe61e](https://etherscan.io/tx/0xa9a1b8ea288eb9ad315088f17f7c7386b9989c95b4d13c81b69d5ddad7ffe61e) (Cream Finance Exploit)
- [0xeb87ebc0a18aca7d2a9ffcabf61aa69c9e8d3c6efade9e2303f8857717fb9eb7](https://etherscan.io/tx/0xeb87ebc0a18aca7d2a9ffcabf61aa69c9e8d3c6efade9e2303f8857717fb9eb7) (Sturdy Finance Exploit)
