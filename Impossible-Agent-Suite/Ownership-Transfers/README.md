# Ownership Transfer Agent

## Description

This agent detects ownership transfers in following contracts

- `0x0da6ed8b13214ff28e9ca979dd37439e8a88f6c4`, // STAX
- `0xb0e1fc65c1a741b4662b813eb787d369b8614af1`, // IF
- `0x0b15ddf19d47e6a86a56148fb4afffc6929bcb89`, // IDIA
- `0x1d37f1e6f0cce814f367d2765ebad5448e59b91b`, // IF Allocation Master V1.5

## Supported Chains

- BSC

## Alerts

- IMPOSSIBLE-3
  - Fired when `OwnershipTransferred` event is emitted.
  - Severity is always set to "High"
  - Type is always set to "Info"
  - Metadata contains:
    - `contract`: The contract event occured
    - `previousOwner`: The current owner
    - `newOwner`: The new owner
