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

### Mainnet

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set an Ethereum Mainnet RPC url as
`jsonRpcUrl` in your `forta.config.json` file.

```
npm run block 14976860
```

This test configuration has `tvlPercentageThreshold` set to `0`, so every swap is considered a large swap and thus has
an associated finding.

### Kovan Testnet (PoC)

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set a Kovan Testnet RPC url as `jsonRpcUrl`
in your `forta.config.json` file.

```
npm run block 32284039
```

As noted in the PoC at `PoC/MockVault.sol`, there should be findings from pool IDs `0`, `1`, `3`, `4` and `6` (as `bytes32`).
