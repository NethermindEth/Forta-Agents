# Balancer Large Flash Loan Bot

## Description

This bot detects large flash loans (i.e. the amount of tokens borrowed is a significant fraction of the Vault's balance
for that token) in the Balancer protocol. Minimum percentage of the Vault balance that, when borrowed, leads to a finding set to tvlPercentageThreshold: "50.5%"

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-4
  - Fired when a Balancer flash loan is "large"
  - Severity is always set to "Unknown"
  - Type is always set to "Info"
  - Metadata:
    - `recipient`: The flash loan recipient
    - `token`: The borrowed token address
    - `amount`: The amount borrowed
    - `tvlPercentage`: The percentage of the Vault's token balance that was borrowed

## Test Data

### Mainnet

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set an Ethereum Mainnet RPC url as
> `jsonRpcUrl` in your `forta.config.json` file.

```
npm run tx 0x8d3fcc8bee4c7e81b09fac2cfbf3a4e9c3dfc2c03a8ef0fb79c1cffe80b2e7a5
```

This test configuration has `tvlPercentageThreshold` set to `2.5%`, and considering the amount borrowed is `~3.56%`, a
finding will be emitted.

### Polygon

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set a Polygon RPC url as `jsonRpcUrl` in
> your `forta.config.json` file.

```
npm run tx 0x335c3c06d8ff44cfb30519ef69949a7c9007b23468d1b2f7dd849391b6bc82bd
```

This test configuration has `tvlPercentageThreshold` set to `0.1%`, and considering the amount borrowed is `~0.103%`, a
finding will be emitted.

### Arbitrum

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set an Arbitrum RPC url as `jsonRpcUrl` in
> your `forta.config.json` file.

```
npm run tx 0x29579083827103f6dd064613321565395413ea206c55c3ef375282dc8f17bf27
```

This test configuration has `tvlPercentageThreshold` set to `0.015%`, and considering the amount borrowed is `~0.016%`, a
finding will be emitted.

### Kovan Testnet (PoC)

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set a Kovan Testnet RPC url as `jsonRpcUrl`
> in your `forta.config.json` file.

```
npm run tx 0x7eadf4a2d406e64f82a001d76b5fe46755d0146a3fe171e25699c016f17e43f9
```

As noted in the PoC at `PoC/MockVault.sol`, there should be findings of flash loan amounts `5051` and `5050`
(MockVault balance of `token0` is `10000` and the threshold is `50.5%`) and also of amount `51` (MockVault balance of
`token1` is `100` and the threshold is `50.5%`).
