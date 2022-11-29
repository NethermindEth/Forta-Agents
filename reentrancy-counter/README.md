# Reentrancy counter

## Description

This agent detects report transaction where reentrancy ocur, based on the calls stack provided in the transaction traces.
It report the amount of repeated calls with different severities according to different thresholds.

## Supported Chains

- Ethereum
- Optimism
- Binance Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

Describe each of the type of alerts fired by this agent

- NETHFORTA-25
  - Fired when in a transaction ocur multiples nested calls to the same contract (reentrancy)
  - It report all the posible severities based on different thresholds of the amount of calls
  - Type is always set to "suspicious"
  - The metadata contains the reentered address & the reentrancy counter
