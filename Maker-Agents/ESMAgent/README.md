# MakerDAO Emergency Shutdown Agent

## Description

This agent detects: 
- `Fire` event emissions by the ESM contract.
- `Join` event emissions by the ESM contract with a value greater than 2 MKR.

> Note: The Emergency Shutdown contract address is gotten from calling `getAddress` in the ChainLog contract with a `bytes32` representation of `"MCD_ESM"` as the argument.
ChainLog contract address: `0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F`

## Supported Chains

- Ethereum

## Alerts

Description of each type of alert fired by this agent

- MakerDAO-ESM-1
  - Fired when `Join` event with a value greater than 2 MKR is emitted.
  - Severity is always set to "Medium" .
  - Type is always set to "Suspicious".
  - The metadata contains:
    - `usr`: Address calling `join` method.
    - `amount`: Amount used for `join`.
- MakerDAO-ESM-2
  - Fired when `Fire` event is emitted.
  - Severity is always set to "Critical".
  - Type is always set to "Suspicious".
  - The metadata contains:
    - `ESM_address`: Address of ESM contract.
    - `from`: Address that initiated the transaction that caused the `Fire` event emission.

## Test Data

- [0x4e6b5d018341ce5ca5fc449be7ce021f9a71e76d1c9225c6fd1c50140d1a5843](https://etherscan.io/tx/0x4e6b5d018341ce5ca5fc449be7ce021f9a71e76d1c9225c6fd1c50140d1a5843) (`Join` - To test this transaction, you must adjust the MKR threshold. See L19 in `join.event.ts`.)