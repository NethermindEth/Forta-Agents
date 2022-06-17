# Balancer Large Swap Bot

## Description

This bot detects large swaps (i.e. any of the tokens' amount relative to the Vault's token balance in the previous
block is above a set threshold) in the Balancer protocol.

The bot behavior can be customized in the `src/agent.config.ts` file.

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-3
  - Fired when a swap is considered "large"
  - Severity is always set to "unknown"
  - Type is always set to "info"
  - Metadata:
    - `poolId`: The swap's `poolId`
    - `tokenIn`: The swap's `tokenIn`
    - `tokenOut`: The swap's `tokenOut`
    - `amountIn`: The swap's `amountIn`
    - `amountOut`: The swap's `amountOut`
    - `percentageIn`: The percentage of `amountIn` relative to the previous block's Vault `tokenIn` balance
    - `percentageOut`: The percentage of `amountOut` relative to the previous block's Vault `tokenOut` balance

## Test Data
