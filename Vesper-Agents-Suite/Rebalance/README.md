# Vesper Rebalance Agent

## Description

This agent detects Vesper strategies not rebalanced since a long time
> The threshold time used is two weeks

## Alerts

- VESPER-4
  - Fired when rebalance method is not called since two weeks in any of the vesper strategies
  - Severity is always set to "info"
  - Type is always set to "info"
  - The alert metadata includes:
    - `strategy`: The address of the not rebalanced strategy
    - `elapsedTime`: Time passed since the last rebalance call
    - `threshold`: Maximum time allowed without a call to rebalance method
