# Large Apeswap LP Deposit/Withdrawal Bot

## Description

This bot detects LP deposits and withdrawals in Apeswap pools when the `amount0`/`amount1` and the pool's `totalSupply` are high.
> The thresholds `AMOUNT_THRESHOLD_PERCENTAGE`, `POOL_SUPPLY_THRESHOLD` of what is considered high, can be adjusted in **src/utils.ts**.


## Supported Chains

- BNB Smart Chain
- Polygon

## Alerts

- APESWAP-8-1
  - Fired when a `Mint` event is emitted with `amount0`/`amount1` that exceed the threshold from a pool with a large `totalSupply`. 
  - Severity is always set to "Info". 
  - Type is always set to "Info".
  - Metadata contains:
    - `pool`: The address of the pool.
    - `token0`: The address of token0.
    - `amount0`: The amount of token0 deposited.
    - `token1`: The address of token1.
    - `amount1`: The amount of token1 deposited.
  
- APESWAP-8-2
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

The bot behaviour can be verified with the following transaction:

- [0x6fb548f53f46f32f7888cd9b29fa8315be2b86b8f496eb9b701c09ed0fd0b99e](https://bscscan.com/tx/0x6fb548f53f46f32f7888cd9b29fa8315be2b86b8f496eb9b701c09ed0fd0b99e) 
  > `AMOUNT_THRESHOLD_PERCENTAGE` should be set to <= 3 for this test transaction.
