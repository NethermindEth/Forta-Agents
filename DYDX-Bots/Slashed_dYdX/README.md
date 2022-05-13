# Slashed dYdX Bot

## Description

This bot detects slashing events in the Safety Module contract.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- DYDX-12
  - Fired when `Slashed` event is emitted.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `amount`: Slash amount.
    - `recipient`: The address to receive the slashed tokens.
    - `newExchangeRate`: Exchange rate after slashing event.
  - Addresses is the address from which the event was emitted.