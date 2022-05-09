# Parameter Changes Bot

## Description

This bot detects parameter changes to both the Safety Module and Liquidity Module contracts.

## Supported Chains

- Ethereum

## Alerts

- DYDX-17-1
  - Fired when `BlackoutWindowChanged` event is emitted.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `blackoutWindow`: New blackout window.
  - Addresses is the address from which the event was emitted.

- DYDX-17-2
  - Fired when `EpochParametersChanged` event is emitted.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `interval`: New interval epoch parameter.
    - `offset`: New offset epoch parameter.
  - Addresses is the address from which the event was emitted.

- DYDX-17-3
  - Fired when `RewardsPerSecondUpdated` event is emitted.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `emissionPerSecond`: The new number of rewards tokens to give out each second.
  - Addresses is the address from which the event was emitted.

## Test Data

The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0x6dEA282B05C76cC9249513554A3C4Bf646908344](https://kovan.etherscan.io/address/0x6dea282b05c76cc9249513554a3c4bf646908344) - `TestProxy`.

[0x15DEa325Cf2581f50Cdc194E688E090ED6206493](https://kovan.etherscan.io/address/0x15DEa325Cf2581f50Cdc194E688E090ED6206493) - `TestImplementation`.

To test specific event emissions, use the following transactions on the Kovan ETH testnet:

[0xaa0458fb2ba763b8a92fc09170e1c7f0395f79d869f5be0ad59f0abf622d91af](https://kovan.etherscan.io/tx/0xaa0458fb2ba763b8a92fc09170e1c7f0395f79d869f5be0ad59f0abf622d91af) - `BlackoutWindowChanged` event.

[0xe0e21149e75f130a645e08e11eddd56175d05c61fa82bf7500455125ee36aefb](https://kovan.etherscan.io/tx/0xe0e21149e75f130a645e08e11eddd56175d05c61fa82bf7500455125ee36aefb) - `EpochParametersChanged` event.

[0xc8f31c78a8382030aace15ea25f0dcf741d8b8e90df77d57196675ae7fe94e7f](https://kovan.etherscan.io/tx/0xc8f31c78a8382030aace15ea25f0dcf741d8b8e90df77d57196675ae7fe94e7f) - `RewardsPerSecondUpdated` event.