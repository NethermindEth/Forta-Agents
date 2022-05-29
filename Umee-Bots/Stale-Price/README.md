# Detect Stale Price Data From Chainlink Aggregator

## Description

This agent monitors price oracle data to see if it has not been updated in over specific threshold.

## Supported Chains

- Ethereum

## Alerts

- UMEE-3
  - Fired price stop been updated for certain asset.
  - Severity is always set to "Medium".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - asset: The address of the asset.
    - source: The address of the source.
    - lastTime: The last time the price had been changed
