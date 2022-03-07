# Pair created event monitor agent

## Description

This agent detects a `PairCreated` event emission from `Swap Factory V1`

## Supported Chains

- Binance Smart Chain

## Alerts

Describe each of the type of alerts fired by this agent

- IMPOSSIBLE-7
  - Fired when the contract `Swap Factory V1` emits a `PairCreated` event
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata fields
    - token\_0: A token in the pair 
    - token\_1: A token in the pair

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x748f9107aea4c2c73558a792badf8fd4406c796583bef7d8061b4ae54805a929 (BSC network)
