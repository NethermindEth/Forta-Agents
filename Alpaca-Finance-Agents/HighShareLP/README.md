# Worker with too much shares

## Description

This agent detects when a worker owns a percent of the shares bigger than the specified threshold. The agent does not scan every block because the computation does more requests than usual, also the percents computed will not change very frequently.

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
    - `percent`: Percent of shares owned by the worker.

