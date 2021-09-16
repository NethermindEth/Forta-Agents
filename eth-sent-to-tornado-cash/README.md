# Tornado Cash 1

## Description

This agent detects big values of eth sent into tornado from the same address in a one day timeframe.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- NETHFORTA-22
  - Fired when an address send more than 100 eth to Tornado cash in one day.
  - Severity is always set to "high".
  - Type is always set to "suspicious".
  - The transaction sender can be found in the metadata.
