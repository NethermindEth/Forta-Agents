# AllocPoint Change Agent

## Description

This agent detects when PancakeSwap's Timelock contract has a `QueueTransaction` event emitted from successful call to a pool's `set` function to update `allocPoint`. It also detects when a Mdex pool has its `set` function called by `boardroom` to update `allocPoint`.

## Supported Chains

- Binance Smart Chain (BSC)

## Alerts

Describe each of the type of alerts fired by this agent

- ALPACA-6
  - Fired when a PancakeSwap pool has its `set` function queued to be called by the `Timelock` contract. Also fired when a Mdex pool has its `set` function called.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `poolId`: Id of the target pool.
    - `allocPoint`: Allocation Point to be updated in target pool.
    - `withUpdate`: `Boolean` that determines whether the rewards for pools should update.
    - `target`: Address of contract that can call `set`.

## Test Data

The agent behaviour can be verified with the following transactions:

- [0xf04d2f2b6a0c669535d71930d8278fc9b54ef78ade7e278e31d5ec630aeb8c72](https://bscscan.com/tx/0xf04d2f2b6a0c669535d71930d8278fc9b54ef78ade7e278e31d5ec630aeb8c72) (Call from PancakeSwap's `Timelock` to `set` function.)
- [0xaabb06ab08335ba025e549882bc717c0d58d8c9f17e7992bbe1ca23b4acbba83](https://bscscan.com/tx/0xaabb06ab08335ba025e549882bc717c0d58d8c9f17e7992bbe1ca23b4acbba83) (Call to `set` function on Mdex `BSCPool` contract.)
