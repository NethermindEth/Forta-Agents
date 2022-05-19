# Detect reentrancy in LendingPool

## Description

Detects reentrancy in any call to LendingProtocol. If that’s the case, emits an alert.

## Supported Chains

- Ethereum

## Alerts

- Um-09
  - Fired when in a transaction occur multiples nested calls to the same contract (reentrancy)
  - Severity is always set to "High".
  - Type is always set to "Exploit".
  - Metadata contains:
    - transactionName: The transaction name
