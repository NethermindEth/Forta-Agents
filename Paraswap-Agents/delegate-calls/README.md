# Delegated Function Call Agent

## Description

This agent detects delagated calls to `MultiPath.multiSwap` and `MultiPath.megaSwap` from the contract `AugustusSwapper` (see [here](https://developers.paraswap.network/smart-contracts#augustusswapper) for more details)

## Supported Chains

- Ethereum
- Polygon
- Binance Smart Chain
- Avalanche
- Fantom
- Ropsten

## Alerts

- PARASWAP-3
  - Fired when `AugustusSwapper` makes a delegated call to `MultiPath.multiSwap` or `MultiPath.megaSwap`
  - Severity is set to "Info"
  - Type is set to "Info"
  - Metadata:
    - `function`: The function that was called in the `delegatecall`. Either `multiSwap` or `megaSwap`
    - `multiPathAddress`: The contract called by the `AugustusSwapper` contract through a `delegatecall`

## Test Data

The agent behaviour can be verified with the following transactions:
- On Paraswap protocol (Ethereum):
  - `0x161929d7651f1e231ed93d42a620a85aefba7ff154a34eb388bd1179d6192ce2`
    - (delegatecall to `multiSwap`, finding generated)
  - `0x9d5ed5e3146461f0fc99b47ccd7f5694fae1080c255de9ce8ae3bc4464957632`
    - (delegatecall to `megaSwap`, finding generated)
  - `0x94c0a7cd60587e03dfd92b5ee200d16cef7834c10267fe12dd178f6659f1c702`
    - (delegatecall to a non `multiSwap`/`megaSwap` function, no finding generated)
