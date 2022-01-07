# BondPriceChanged Agent

## Description

This agent fires finding when bond contracts emit BondPriceChanged event.

## Supported Chains

- Ethereum

## Alerts

- OlympusDAO-8
  - Fired when a bond contract emits BondPriceChanged event.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata field contains:
    - `priceInUSD`: Value of argument priceInUSD in the event emitted.
    - `internalPrice`: Value of argument internalPrice in the event emitted.
    - `debtRatio`: Value of argument debtRatio in the event emitted.

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x5294a03da1a13365a170a20e11794c8aab34c50519f31ca9913a6af09b638046
