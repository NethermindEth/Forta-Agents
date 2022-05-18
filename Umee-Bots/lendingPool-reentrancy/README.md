# Detect reentrancy in LendingPool

## Description

Detects reentrancy in any call to LendingProtocol. If that’s the case, emits an alert.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- Um-09
  - Fired when in a transaction ocur multiples nested calls to the same contract (reentrancy)
  - Severity is always set to "High".
  - Type is always set to "Suspicious".
  - Metadata contains:
     - transactionName: The transaction name  


