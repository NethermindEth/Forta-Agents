# Pair created event monitor bot

## Description

This bot detects a `PairCreated` event emission from `Swap Factory V3`

## Supported Chains

- Binance Smart Chain

## Alerts

Describe each of the type of alerts fired by this bot

- IMPOSSIBLE-7
  - Fired when the contract `Swap Factory V3` emits a `PairCreated` event
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata fields
    - `token\_0`: First token of the pair 
    - `token\_1`: Second token of the pair

## Test Data

The bot behaviour can be verified with the following transactions:

- 0xf95dfa5e98c81a5be84f15d95714c99016085d07baf543e284c895092e068056 (BSC network)
