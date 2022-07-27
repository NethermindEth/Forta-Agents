# Pair Created Bot

## Description

This bot detects the creation of a new tradable pair on Pancakeswap DEX.

## Supported Chains

- Binance Smart Chain

## Alerts

- CAKE-1
  - Fired when a transaction creates a new tradable pair on Pancakeswap's PancakeFactory contract.
  - Severity is always set to "Info".
  - Type is always set to "Info". 
  - Metadata contains the following fields: 
    - `tokenA`: The address of the first token of the created pair.
    - `tokenB`: The address of the second token of the created pair.
    - `pair`: The address of the created pair.

## Test Data

The bot behaviour can be verified with the following transaction:

- [0x2f02adb395905cd51cd8ae24ff9cc5c65ff168b17b7f424a7618233320e11f19](https://www.bscscan.com/tx/0x2f02adb395905cd51cd8ae24ff9cc5c65ff168b17b7f424a7618233320e11f19) - `Binance Smart Chain`



