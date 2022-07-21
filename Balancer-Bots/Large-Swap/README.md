# Balancer Large Swap Bot

## Description

This bot detects large swaps (i.e. the amount of tokens swapped for any of the tokens is a significant fraction of the
token's pool reserves) in the Balancer protocol.

The bot behavior can be customized in the `src/agent.config.ts` file. Minimum swapped token amount relative to the Vault TVL percentage that leads to a finding emission (in %) set to tvlPercentageThreshold: "50.5" // 50.5%

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-3
  - Fired when a swap is considered "large"
  - Severity is always set to "Unknown"
  - Type is always set to "Info"
  - Metadata:
    - `poolId`: The swap's `poolId`
    - `tokenIn`: The swap's `tokenIn` address
    - `tokenInSymbol`: The swap's `tokenIn` symbol
    - `tokenOut`: The swap's `tokenOut` address
    - `tokenOutSymbol`: The swap's `tokenOut` symbol'
    - `amountIn`: The swap's `amountIn`
    - `amountOut`: The swap's `amountOut`
    - `percentageIn`: The percentage of `amountIn` relative to the previous block's Vault `tokenIn` balance
    - `percentageOut`: The percentage of `amountOut` relative to the previous block's Vault `tokenOut` balance

## Test Data

### Mainnet

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set an Ethereum Mainnet RPC url as
> `jsonRpcUrl` in your `forta.config.json` file.

```
npm run tx 0x285e41709fdf7407de514dbd6e4d65d321b9a8fdee3b0267089a8c758d6002a3
```

This test configuration has `tvlPercentageThreshold` set to `0`, so every swap is considered a large swap and thus has
an associated finding.

### Görli Testnet (PoC)

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set a Görli Testnet RPC url as `jsonRpcUrl`
> in your `forta.config.json` file.

```
npm run tx 0x3521bb710189621158b7234a3623fbf1ff4004a20dc1bcfd864bfc22e6d476bf
```

As noted in the PoC at `PoC/MockVault.sol`, there should be findings from pool IDs `0`, `1`, `3`, `4` and `6` (as `bytes32`).
