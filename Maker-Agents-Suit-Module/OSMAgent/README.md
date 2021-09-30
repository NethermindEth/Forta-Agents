 MakerDAO Oracle Security Agent

## Description

This agent detects: 
- Rely method called on an OSM contract.
- Deny method called on an OSM contract.
- When `poke` method on MegaPoker contract was not called in the first ten minutes of an hour.
- When the enqueued price deviate more than 6% from current price on an OSM contract.

> MegaPoker contract address: `0x2417c2762ec12f2696f62cfa5492953b9467dc81`

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- MakerDAO-OSM-1
  - Fired when the enqueued price deviate more than 6% from current price in some OSM contract.
  - Severity is always set to "info" .
  - Type is always set to "suspicious".
  - The metadata contains:
    - `contractAddress`: OSM contract address.

- MakerDAO-OSM-2
  - Fired when Deny method is called on some OSM contract
  - Severity is always set to "medium".
  - Type is always set to "unknow".
  - The metadata contains:
    - `contract`: OSM contract address.

- MakerDAO-OSM-3
  - Fired when Rely method is called on some OSM contract
  - Severity is always set to "medium".
  - Type is always set to "unknow".
  - The metadata contains:
    - `contract`: OSM contract address.

- MakerDAO-OSM-4
  - Fired when `poke` method from MegaPoker contract is not called in the first ten minutes of an hour.
  - Severity is always set to "critical".
  - Type is always set to "unknow".