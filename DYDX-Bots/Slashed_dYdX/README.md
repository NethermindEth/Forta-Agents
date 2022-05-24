# Slashed dYdX Bot

## Description

This bot detects slashing events in the Safety Module contract.

## Supported Chains

- Ethereum

## Alerts

- DYDX-12
  - Fired when `Slashed` event is emitted in dYdX Safety Module.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `amount`: Slash amount.
    - `recipient`: The address to receive the slashed tokens.
    - `newExchangeRate`: Exchange rate after slashing event.
  - Addresses contains the address from which the event was emitted.


## Test Data
The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0x45f35efd4555Ea1443BF19439761066EF7e18dC1](https://kovan.etherscan.io/address/0xa1e799D7308949a6514761194E35d0bbb7a458Cf) - `TestProxy`.

[0x12c11B88eeaFa5587cdE0dFBC4FFc2c0E8572A57](https://kovan.etherscan.io/address/0x12c11B88eeaFa5587cdE0dFBC4FFc2c0E8572A57) - `TestImplementation`.

To test specific event emissions, use the following transactions on the Kovan ETH testnet:

[0xb0f93dd0dff0ec7c3a6d9c030212f97606ae1e3bc73453af705cfec181193b41](https://kovan.etherscan.io/tx/0xb0f93dd0dff0ec7c3a6d9c030212f97606ae1e3bc73453af705cfec181193b41) - `Slashed` event.