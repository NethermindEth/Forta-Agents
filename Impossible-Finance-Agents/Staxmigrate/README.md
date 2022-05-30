# Impossible Finance staxMigrate mint bot

## Description

This bot detects when Impossible Finance tokens are minted through the function `staxMigrate` where the amount of `STAX` tokens input are not the same as the amount of `IF` tokens output

## Supported Chains

- Binance Smart Chain

## Alerts

- IMPOSSIBLE-10
  - Fired when tokens are minted through `staxMigrate` where the `staxMigrate` argument `amount` is different to the `Transfer` argument `value`
  - Severity is always set to "high"
  - Type is always set to "exploit"
  - Metadata:
    - `receiver`:  The address that is receiving the minted tokens
    - `staxAmountIn`: The amount of `STAX` tokens used as input
    - `ifAmountOut`: The amount of `IF` tokens transferred as output
