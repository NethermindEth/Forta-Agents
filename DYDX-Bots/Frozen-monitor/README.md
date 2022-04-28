# Frozen state monitor

## Description

This bot detects frozen state changes in dYdX perpetual exchange contract.

> Perpetual contract : `0xD54f502e184B6B739d7D27a6410a67dc462D69c8`

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
