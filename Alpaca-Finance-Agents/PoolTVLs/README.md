# Low TVL on Pool

## Description

This agent detects when a pool has low TVL. Low is defined through a `threshold` value.

## Supported Chains

- Binance Smart Chain

## Alerts

Describe each of the type of alerts fired by this agent

- ALPACA-7
  - Fired when a pool has low TVL.
  - Severity is always set to "Info".
  - Type is always set to "Info". 
  - Metadata contain the next fields:
    - `pool`: Address of the pool with low TVL.
    - `TVL`: Computed TVL in the pool.

