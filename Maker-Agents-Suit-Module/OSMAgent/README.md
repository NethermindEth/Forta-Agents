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
  - Fired when the enqueued price deviates more than 6% from current price in an OSM contract.
  - Severity is always set to "info" .
  - Type is always set to "suspicious".
  - The metadata contains:
    - `contractAddress`: OSM contract address.
    - `currentPrice`: The current price. 
    - `queuedPrice`: The queued price.

- MakerDAO-OSM-2
  - Fired when Deny method is called on an OSM contract
  - Severity is always set to "medium".
  - Type is always set to "unknown".
  - The metadata contains:
    - `contract`: OSM contract address.
    - `deniedAddress`: The denied address.

- MakerDAO-OSM-3
  - Fired when Rely method is called on an OSM contract
  - Severity is always set to "medium".
  - Type is always set to "unknown".
  - The metadata contains:
    - `contract`: OSM contract address.
    - `reliedAddress`: the relied address.

- MakerDAO-OSM-4
  - Fired when `poke` method from MegaPoker contract is not called in the first ten minutes of an hour.
  - Severity is always set to "critical".
  - Type is always set to "unknown".
  - The metadata contains: 
    - `MegaPokerContract`: MegaPoker contract address.

## Test transactions
The agent behavior can be checked with the following transactions (Mainnet):

  - 0x982726c182e230aabe159ac92da84f8d9561363aa05a2c263ffc5625bde4ffb8 (Rely call on an OSM contract)
  - 0xfdd1c113d83ea4837e974e5c45088ec6772fe3551b6852210f0b754aecd30b47 (Deny call on an OSM contract)