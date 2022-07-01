# Flash Loan Bot

## Description

This bot detects flashloans through the function `swap` on pairs generated through `Swap Factory V3`

## Supported Chains

- Binance Smart Chain

## Alerts

- IMPOSSIBLE-5
  - Fired when a transaction involved a flash loan through an IF swap
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata fields
    - `amount0Out`: The amount of token0 that was sent to `to`
    - `amount1Out`: The amount of token1 than was sent to `to`
    - `to`: The address that receives the tokens and executes the flashloan
    - `data`: The data to be passed as an argument in the call to `stableXCall` on the address `to`
