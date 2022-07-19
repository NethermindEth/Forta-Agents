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
  - Severity is always set to "unknown"
  - Type is always set to "info"
  - Metadata:
    - `recipient`: The flash loan recipient
    - `token`: The borrowed token address
    - `amount`: The amount borrowed
    - `tvlPercentage`: The percentage of the Vault's token balance that was borrowed

## Test Data

### Mainnet

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set an Ethereum Mainnet RPC url as
`jsonRpcUrl` in your `forta.config.json` file.

```
npm run block 15003354
```

This test configuration has `tvlPercentageThreshold` set to `2.5%`, and considering the amount borrowed is `~3.56%`, a
finding will be emitted.

### Polygon

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set a Polygon RPC url as `jsonRpcUrl` in
your `forta.config.json` file.

```
npm run block 29841136
```

This test configuration has `tvlPercentageThreshold` set to `0.1%`, and considering the amount borrowed is `~0.103%`, a
finding will be emitted.

### Arbitrum

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set an Arbitrum RPC url as `jsonRpcUrl` in
your `forta.config.json` file.

```
npm run block 15235537
```

This test configuration has `tvlPercentageThreshold` set to `0.015%`, and considering the amount borrowed is `~0.016%`, a
finding will be emitted.

### Kovan Testnet (PoC)

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set a Kovan Testnet RPC url as `jsonRpcUrl`
in your `forta.config.json` file.

```
npm run block 32303946
```

As noted in the PoC at `PoC/MockVault.sol`, there should be findings of flash loan amounts `5051` and `5050`
(MockVault balance of `token0` is `10000` and the threshold is `50.5%`) and also of amount `51` (MockVault balance of
`token1` is `100` and the threshold is `50.5%`).


