# Yearn Multisigs agents

## Description

This agent monitor the events and transactions that occur in the Year multisig wallets

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- YEARN-1-1
  - Fired when a yearn multisig wallet emits `AddedOwner` event
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `Multisig`: Wallet that emits the event,
    - `NewOwner`: The owner added

- YEARN-1-2
  - Fired when a yearn multisig wallet emits `RemovedOwner` event
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `Multisig`: Wallet that emits the event,
    - `OldOwner`: The owner removed

- YEARN-1-3
  - Fired when a yearn multisig wallet emits `ExecutionSuccess` event
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `Multisig`: Wallet that emits the event,
    - `TxHash`: The hash of the executed transaction,
    - `Payment`: The payment associated to the execution,

- YEARN-1-4
  - Fired when a yearn multisig wallet emits `ExecutionFailure` event
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `Multisig`: Wallet that emits the event,
    - `TxHash`: The hash of the executed transaction,
    - `Payment`: The payment associated to the execution,

- YEARN-1-5
  - Fired when a yearn multisig sends ERC20 tokens
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `From`: Wallet that sends the tokens,
    - `To`: Address that receives the tokens,
    - `Value`: Value sent,
    - `TokenAddress`: Address of the token being sent,
  - This alerts can be false positives if the multsigs interact with a non-ERC20 contract that emit an event with signature `Transfer(indexed address, address, indexed value)`

- YEARN-1-6
  - Fired when a yearn multisig sends ETH tokens
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata contains:
    - `From`: Wallet that sends the tokens,
    - `To`: Address that receives the tokens,
    - `Value`: Value sent,
