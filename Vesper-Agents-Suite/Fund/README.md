# Vesper - Fund Agent

## Description

This agent detects for idle funds in a pool.

- Vesper-5-1
  - Fired when the current dle funds in the pool > 10% of total value.
  - Severity is always set to "info".
  - Type is always set to "High".

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- Vesper-3
  - Fired when the relationship: tokenHere() - totalValue() \* (MAX_BPS - totalDebtRatio) > 10% of the totalValue()
