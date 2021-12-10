# Create lock Agent

## Description

This agent detects lock creation in Voting Escrow contract.

## Supported Chains

- Ethereum

## Alerts

- CURVE-7
  - Fired when a Deposit event is emitted with type set to 1.
  - Severity is always set to "low".
  - Type is always set to "suspicious".
  - Metadata includes: 
    - `from`: address of the account calling create lock function.
    - `value`: The amount of CRV locked.
    - `locktime`: time when to unlock the CRV tokens. 

## Test Data

The agent behaviour can be verified with the following transaction:

- 0x17df2b1ae249f36d5f2677a23d9f809c7797c361545f583cf33d912bb7093aa4
