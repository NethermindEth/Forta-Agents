# High Gas Usage Agent

## Description

This agent detects transactions with high gas Price - above 10 Gwei

## Supported Chains

- BSC

## Alerts

- IMPOSSIBLE-2
  - Fired when a transaction uses more than 10 Gwei as `Gas Price`
  - Severity is always set to "High"
  - Type is always set to "Info"
  - Metadata includes:
    - `contract`: The contract address that transaction interacted.
    - `gas`: The gas price used.
