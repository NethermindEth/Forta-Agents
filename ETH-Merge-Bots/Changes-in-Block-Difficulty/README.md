# Unusual Changes in Block Difficulty Detection Bot

## Description

This bot detects blocks with unusual changes in difficulty compared to the moving average of a customizable amount of blocks.

> The bot behaviour can be customized by modifying the fields `NUMBER_OF_BLOCKS_TO_CHECK` and `FINDING_THRESHOLD` in `src/utils.ts`, L4-5.

## Supported Chains

- Ethereum

## Alerts

- ETH-2-1

  - Fired when there is an **increase** in block difficulty over the moving average by a specified percentage threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `blockDifficulty`: The current block's difficulty.
    - `movingAverage`: The moving average of the last `NUMBER_OF_BLOCKS_TO_CHECK` blocks.
    - `increasePercentage`: The increase in percentage.

- ETH-2-2

  - Fired when there is a **decrease** in block difficulty over the moving average by a specified percentage threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `blockDifficulty`: The current block's difficulty.
    - `movingAverage`: The moving average of the last `NUMBER_OF_BLOCKS_TO_CHECK` blocks.
    - `decreasePercentage`: The decrease in percentage.

## Test Data

The bot behaviour can be verified with the following blocks, by executing the command `npm run block <BLOCK_NUMBER>`:

- [15395565](https://etherscan.io/block/15395565)
- [15395567](https://etherscan.io/block/15395567)
