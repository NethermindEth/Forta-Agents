# Pickle Finance Multisigs agents

## Description

This agent monitor the events and transactions that occur in the Pickle Finance multisig wallets

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- pickle-4-1
  - Fired when a Pickle Finance multisig wallet emits `AddedOwner` event
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `Multisig`: Wallet that emits the event,
    - `NewOwner`: The owner added

- pickle-4-2
  - Fired when a Pickle Finance multisig wallet emits `RemovedOwner` event
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `Multisig`: Wallet that emits the event,
    - `OldOwner`: The owner removed

- pickle-4-3
  - Fired when a Pickle Finance multisig wallet emits `ExecutionSuccess` event
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `Multisig`: Wallet that emits the event,
    - `TxHash`: The hash of the executed transaction,
    - `Payment`: The payment associated to the execution,

- pickle-4-4
  - Fired when a Pickle Finance multisig wallet emits `ExecutionFailure` event
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `Multisig`: Wallet that emits the event,
    - `TxHash`: The hash of the executed transaction,
    - `Payment`: The payment associated to the execution,

- pickle-4-5
  - Fired when a Pickle Finance multisig sends ERC20 tokens
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `From`: Wallet that sends the tokens,
    - `To`: Address that receives the tokens,
    - `Value`: Value sent,
    - `TokenAddress`: Address of the token being sent,
  - This alerts can be false positives if the multsigs interact with a non-ERC20 contract that emit an event with signature `Transfer(indexed address, address, indexed value)`

- pickle-4-6
  - Fired when a Pickle Finance multisig sends ETH tokens
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `From`: Wallet that sends the tokens,
    - `To`: Address that receives the tokens,
    - `Value`: Value sent,
