# Parameter Changes Bot

## Description

This agent detects parameter changes to both the Safety Module and Liquidity Module contracts.

## Supported Chains

- Ethereum

## Alerts

- DYDX-17-1
  - Fired when `BlackoutWindowChanged` event is emitted.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `blackoutWindow`: New blackout window.

- DYDX-17-2
  - Fired when `EpochParametersChanged` event is emitted.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `interval`: New interval epoch parameter.
    - `offset`: New offset epoch parameter.

- DYDX-17-3
  - Fired when `RewardsPerSecondUpdated` event is emitted.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `emissionPerSecond`: The new number of rewards tokens to give out each second.