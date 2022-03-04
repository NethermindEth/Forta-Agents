# Large deposits / withdrawals from LP pool

## Description

This agent detects large add/remove Liquity in Impossible Finance Pairs
> - Pairs are taken form the factory `0x918d7e714243F7d9d463C37e106235dCde294ffC`
> - Large is defined based on a percent of the reserves of each token
> - Used Mint/Burn events to detect add/remove Liquity

## Supported Chains

- BSC

## Alerts

- IMPOSSIBLE-9-1
  - Fired when a transaction add large Liquidity to an Impossible Finance Pool 
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
  - Fired when a transaction remove large Liquidity to an Impossible Finance Pool 
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
