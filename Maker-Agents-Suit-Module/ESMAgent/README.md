# MakerDAO Emergency Shutdown Agent

## Description

This agent detects: 
- `Fire` event emissions by the ESM contract.
- `Join` event emissions by the ESM contract with a value greater than 2 MKR.

> Emergency Shutdown contract address: `0x09e05fF6142F2f9de8B6B65855A1d56B6cfE4c58`
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

## Test Data

- [0x4e6b5d018341ce5ca5fc449be7ce021f9a71e76d1c9225c6fd1c50140d1a5843](https://etherscan.io/tx/0x4e6b5d018341ce5ca5fc449be7ce021f9a71e76d1c9225c6fd1c50140d1a5843) (`Join` - To test this transaction, you must adjust the MKR threshold. See L19 in `join.event.ts`.)