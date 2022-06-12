# Large Open/Increase Position Size Bot

## Description

This bot detects when an open/increase position is large. The bot listens to `UpdatePosition` and `IncreasePosition` event emissions and creates a finding if the `sizeDelta` exceeds the `threshold` 

> The `threshold` can be adjusted in **src/utils.ts**.

## Supported Chains

- Arbitrum
- Avalanche

## Alerts

- GMX-1-1
  - Fired when the position `size` of the emitted with `UpdatePosition` event is equivalent to the `sizeDelta` of the emitted `IncreasePosition` event
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `gmxVault`: Address of GMX Vault contract.
    - `account`: Address of position owner.
    - `positionSize`: Size of the opened position.
    - `positionKey`: Key of the opened position.

- GMX-1-2
  - Fired only when the `sizeDelta` of the emitted `IncreasePosition` event is lower than the position `size` of the emitted `UpdatePosition` event.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `gmxVault`: Address of GMX Vault contract.
    - `account`: Address of position owner.
    - `initialPositionSize`: Initial position size before increment.
    - `positionIncrementSize`: Size of the increased position 
    - `finalPositionSize`: Final position size after increment
    - `positionKey`: Key of the increased position.

## Test Data

The bot behaviour can be verified with the following transactions:
- [0xa1497f703ad237a5f43a2df93fe961394e5df2ad548d4cb02c45a865d8fda591](https://arbiscan.io/tx/0xa1497f703ad237a5f43a2df93fe961394e5df2ad548d4cb02c45a865d8fda591) - 
`Arbitrum Mainnet` - UpdatePosition event 
  > Position Size - 147986.41



- [0x70562d5cda648946dcefaf394f1db5591122b61a7924fc17e473fa0372a13213](https://arbiscan.io/tx/0x70562d5cda648946dcefaf394f1db5591122b61a7924fc17e473fa0372a13213) -
`Arbitrum Mainnet` - IncreasePosition event 
  > Position increment size - 73142.32







