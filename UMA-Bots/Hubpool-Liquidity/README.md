# UMA HubPool Liquidity Event Bot

## Description

This bot detects HubPool's `LiquidityAdded` and `LiquidityRemoved` event emissions.

## Supported Chains

- Ethereum

## Alerts

- UMA-6-1
  - Fired when HubPool LiquidityAdded Event is emitted bu the old amount is more than the new amount
  - Severity is always set to "high"
  - Type is always set to "exploit"
  - Metadata fields
    - `l1Token`: the layer 1 token address
    - `oldAmount`: amount before liquidity is added
    - `newAmount`: amount after liquidity is added
    - `changeInAmount`: amount added
  
- UMA-6-2
  - Fired when HubPool LiquidityAdded Event is emitted
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata fields
    - `l1Token`: the layer 1 token address
    - `oldAmount`: amount before liquidity is added
    - `newAmount`: amount after liquidity is added
    - `changeInAmount`: amount added

- UMA-6-3
  - Fired when HubPool LiquidityRemoved Event is emitted but the new amount is less than the old amount
  - Severity is always set to "high"
  - Type is always set to "exploit"
  - Metadata fields
    - `l1Token`: the layer 1 token address
    - `oldAmount`: amount before liquidity is removed
    - `newAmount`: amount after liquidity is removed
    - `changeInAmount`: amount removed

- UMA-6-4
  - Fired when HubPool LiquidityRemoved Event is emitted 
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata fields
    - `l1Token`: the layer 1 token address
    - `oldAmount`: amount before liquidity is removed
    - `newAmount`: amount after liquidity is removed
    - `changeInAmount`: amount removed

## Test Data

The bot behavior can be verified with the following contracts on the Goerli ETH testnet:

[0xC9bea435388B76e627Ff99AD1187e520299E0656](https://goerli.etherscan.io/address/0xC9bea435388B76e627Ff99AD1187e520299E0656) - `MockHubPool`.

[0xCDAe5Af83a537bCc8a2D1E2e7f45ca7B1E6B0Dc8](https://goerli.etherscan.io/address/0xCDAe5Af83a537bCc8a2D1E2e7f45ca7B1E6B0Dc8) - `MockToken`.

To test specific event emissions, use the following transactions on the Goerli ETH testnet:

[0x7780501599cd97b3bbc1e5e078234d5ff6ef47d522b7c612061e4645d8434ed1](https://goerli.etherscan.io/tx/0x7780501599cd97b3bbc1e5e078234d5ff6ef47d522b7c612061e4645d8434ed1) - `LiquidityAdded` event.

[0x374ea415ca7cbf3119598e502b59b5724ecdb1b06dee24f52bf9749556c2bce4](https://goerli.etherscan.io/tx/0x374ea415ca7cbf3119598e502b59b5724ecdb1b06dee24f52bf9749556c2bce4) - `LiquidityRemoved` event.