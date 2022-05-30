# High Gas Usage bot

## Description

This bot detects transactions with high gas price where Impossible Finance addresses are involved
> High is defined as above 10 Gwei

## Supported Chains

- Binance Smart Chain

## Alerts

- IMPOSSIBLE-2
  - Fired when a transaction uses a high gas price and involves Impossible Finance addresses
  - Severity is always set to "High"
  - Type is always set to "Info"
  - Metadata includes:
    - `protocolContracts`: The Impossible Finance contract addresses involved in the transaction.
    - `gasInGwei`: The raw gas price used in Gwei.
    - `gasInWei`: The gas price in Wei.
