# Vesper - Fund Agent

## Description

This agent detects for idle funds in a pool.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- Vesper-3
  - Fired when the current idle funds in the pool > 10% of total value. (tokenHere() - totalValue() \* (MAX_BPS - totalDebtRatio) > 10% of the totalValue())
  - Severity is always set to "info".
  - Type is always set to "High".
  - Metadata
    - Ideal funds: Gives list of ideal funds in a pool
