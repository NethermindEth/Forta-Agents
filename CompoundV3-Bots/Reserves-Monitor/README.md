# Reserves Monitor Bot

## Description

This bot monitors reserves in Compound III `comet` contracts. It emits an alert if contract `reserves` reaches the `targetReserves`.
Note that the bot is configurable in `agent.config.ts` file, where:

- `cometAddresses`: contains the list of comet contract adddresses for each network.
- `alertFrequency`: frequency of emitting alerts for the same contract.

## Supported Chains

- Ethereum
- Polygon

## Alerts

- COMP-1
  - Fired when `reserves` reaches or exceeds the `targetReserves` in any of comet contracts.
  - Severity is always set to "Medium"
  - Type is always set to "info"
  - Metadata includes:
    - `comet`: comet contract
    - `reserves`: amount of reserves in comet contract
    - `targetReserves`: amount of target reserves in comet contract

## Test Data

The agent behaviour can be verified with the following transactions:
