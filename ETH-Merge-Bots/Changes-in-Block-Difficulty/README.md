# Unusual Changes in Block Difficulty Detection Bot

## Description

This bot detects blocks with unusual changes in difficulty compared to the moving average. The bot behaviour can be customized by modifying the fields `NUMBER_OF_BLOCKS_TO_CHECK` and `FINDING_THRESHOLD` in `src/utils.ts`, L4-5.

## Supported Chains

- Ethereum

## Alerts

- ETH-2-1

  - Fired when there is an over a threshold percentage **increase** in block difficulty compared to the moving average of the last blocks.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `blockDifficulty`: The current block's difficulty.
    - `movingAverage`: The moving average of the last `NUMBER_OF_BLOCKS_TO_CHECK` blocks.
    - `increasePercentage`: The increase in percentage.

- ETH-2-2

  - Fired when there is an over a threshold percentage **decrease** in block difficulty compared to the moving average of the last blocks.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `blockDifficulty`: The current block's difficulty.
    - `movingAverage`: The moving average of the last `NUMBER_OF_BLOCKS_TO_CHECK` blocks.
    - `decreasePercentage`: The decrease in percentage.

## Test Data

The bot behaviour can be verified with the following blocks:

- 15395565, 15395567
