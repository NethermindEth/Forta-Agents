# AllocPoint Change Agent

## Description

This agent detects when PancakeSwap's Timelock contract has a transaction queued to call a pool's `set()` function to update `allocPoint`. It also detects when a Mdex pool has its `set()` function called to update `allocPoint`.

## Supported Chains

- Binance Smart Chain (BSC)

## Alerts

Describe each of the type of alerts fired by this agent

- ALPACA-6
  - Fired when a transaction consumes more gas than 1,000,000 gas
  - Severity is always set to "Info."
  - Type is always set to "Info."
  - Metadata contains:
    - `poolId`: Id of the target pool.
    - `allocPoint`: Allocation Point to be updated in target pool.
    - `withUpdate`: `Boolean` that determines whether the rewards for pools should update.
    - `target`: Address of contract that can call `set()`.

## Test Data

The agent behaviour can be verified with the following transactions:

- [0xf04d2f2b6a0c669535d71930d8278fc9b54ef78ade7e278e31d5ec630aeb8c72](https://bscscan.com/tx/0xf04d2f2b6a0c669535d71930d8278fc9b54ef78ade7e278e31d5ec630aeb8c72) (Call from PancakeSwap's Timelock to `set()` function.)
