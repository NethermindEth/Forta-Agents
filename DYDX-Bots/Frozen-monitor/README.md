# Frozen state monitor

## Description

This bot detects frozen state changes in dYdX perpetual exchange contract.

## Supported Chains

- Ethereum

## Alerts

- DYDX-2-1

  - Fired when `LogFrozen` event is emitted on dYdX perpetual exchange contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `from`: address running the transaction where the event was emitted.

- DYDX-2-2
  - Fired when `LogUnFrozen` event is emitted on dYdX perpetual exchange contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `from`: address running the transaction where the event was emitted.

## Test Data

The bot behaviour can be verified with the following transactions:
