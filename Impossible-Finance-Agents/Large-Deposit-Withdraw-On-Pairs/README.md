# Large deposits / withdrawals from LP pool

## Description

This bot detects large add/remove Liquidity in Impossible Finance Pairs

> - Pairs are taken form the factory `0x4233ad9b8b7c1ccf0818907908a7f0796a3df85f`
> - Large is defined based on a percent of the reserves of each token
> - Used Mint/Burn events to detect add/remove Liquidity

## Supported Chains

- Binance Smart Chain

## Alerts

- IMPOSSIBLE-9-1

  - Fired when a transaction adds large Liquidity to an Impossible Finance Pool
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `pair`: Address of the pair receiving Liquidity
    - `amount0`: Amount of Liquidity to add to `token0`
    - `amount1`: Amount of Liquidity to add to `token1`
    - `sender`: Address that adds the Liquidity
    - `reserves0`: Amount of reserves of `token0` at the beginning of the block
    - `reserves1`: Amount of reserves of `token1` at the beginning of the block

- IMPOSSIBLE-9-2
  - Fired when a transaction removes large Liquidity from an Impossible Finance Pool
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `pair`: Address of the pair receiving Liquidity
    - `amount0`: Amount of Liquidity to remove from `token0`
    - `amount1`: Amount of Liquidity to remove from `token1`
    - `sender`: Address that adds the Liquidity
    - `to`: Address that receives the removed tokens
    - `reserves0`: Amount of reserves of `token0` at the beginning of the block
    - `reserves1`: Amount of reserves of `token1` at the beginning of the block
