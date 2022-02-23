# High Share Liquidity Pool Agent

## Description

This agent detects when a worker owns more than 51% of the shares in a pool. 

## Supported Chains

- Binance Smart Chain

## Alerts

Describe each of the type of alerts fired by this agent

- ALPACA-5
  - Fired when a worker owns more than `threshold` percent of shares.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - The metadata contains:
    - `worker`: Worker's address owning too much shares.
    - `workerPercentage`: Percentage of shares owned by the worker.

