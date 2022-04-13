# MakerDAO Emergency Shutdown Agent

## Description

This agent detects: 
- `Fire` event emissions by the ESM contract.
- `Join` event emissions by the ESM contract with a value greater than 2 MKR.

> Emergency Shutdown contract address: `0x29CfBd381043D00a98fD9904a431015Fef07af2f`
## Supported Chains

- Ethereum

## Alerts

Description of each type of alert fired by this agent

- MakerDAO-ESM-1
  - Fired when `Join` event with a value greater than 2 MKR is emitted.
  - Severity is always set to "medium" .
  - Type is always set to "suspicious".
  - The metadata contains:
    - `usr`: Address calling `join` method.
    - `amount`: Amount used for `join`.
- MakerDAO-ESM-2
  - Fired when `Fire` event is emitted.
  - Severity is always set to "critical".
  - Type is always set to "suspicious".
  - The metadata contains:
    - `ESM_address`: Address of ESM contract.
    - `from`: Address that initiated the transaction that caused the `Fire` event emission.