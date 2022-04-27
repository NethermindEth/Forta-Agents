# Large Apeswap LP Deposit/Withdrawal Bot

## Description

This bot detects LP deposits and withdrawals in Apeswap pools when the `amount0`/`amount1` and the pool's `totalSupply` are high.
> The thresholds `AMOUNT_THRESHOLD_PERCENTAGE`, `POOL_SUPPLY_THRESHOLD` of what is considered high, can be adjusted in **src/utils.ts**.

## Supported Chains

- Binance Smart Chain

## Alerts

- APESWAP-9-1
  - Fired when a `Mint` event is emitted with `amount0`/`amount1` that exceed the threshold from a pool with a large `totalSupply`. 
  - Severity is always set to "Info". 
  - Type is always set to "Info".
  - Metadata contains:
    - `pool`: The address of the pool.
    - `token0`: The address of token0.
    - `amount0`: The amount of token0 deposited.
    - `token1`: The address of token1.
    - `amount1`: The amount of token1 deposited.
  
- APESWAP-9-2
  - Fired when a `Burn` event is emitted with `amount0`/`amount1` that exceed the threshold from a pool with a large `totalSupply`. 
  - Severity is always set to "Info". 
  - Type is always set to "Info".
  - Metadata contains:
    - `pool`: The address of the pool.
    - `token0`: The address of token0.
    - `amount0`: The amount of token0 withdrawn.
    - `token1`: The address of token1.
    - `amount1`: The amount of token1 withdrawn.

## Test Data

The agent behaviour can be verified with the following transaction:

- [0xf04d2f2b6a0c669535d71930d8278fc9b54ef78ade7e278e31d5ec630aeb8c72](https://bscscan.com/tx/0xf04d2f2b6a0c669535d71930d8278fc9b54ef78ade7e278e31d5ec630aeb8c72) 
  > `AMOUNT_THRESHOLD_PERCENTAGE` should be set to 1.
