# Fallback State Agent

## Description

This agent detects the contract entering a fallback state

## Supported Chains

- Ethereum

## Alerts

- FLEXA-4
  - Fired whenever the contract enters a fallback state
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata fields
    - blockTimestamp: Timestamp of the block
    - blockNumber: Block number of the block
