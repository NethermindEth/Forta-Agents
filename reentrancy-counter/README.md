# Reentrancy counter

## Description

This bot checks transactions for reentrancy. This is done by the bot watching the call stack in transaction traces. It then reports the number of recurrent calls with varying severity based on various thresholds.

## Supported Chains

- Ethereum
- Optimism
- BNB Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

- NETHFORTA-25
  - Fired when multiple nested calls occur to the same contract in a transaction (Reentrancy)
  - It reports all possible severities based on different call volume thresholds.
  - Type is always set to "suspicious"
  - The metadata includes:
  - `address`: The contract address where the reentrancy occurred
  - `reentrancyCount`: A reentrancy counter based on how many times it occurred
