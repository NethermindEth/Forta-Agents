# Vesper - Fund Agent

## Description

This agent detects for idle funds in a pool.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- Vesper-3
  - Fired when the relationship: tokenHere() - totalValue() \* (MAX_BPS - totalDebtRatio) > 10% of the totalValue()
