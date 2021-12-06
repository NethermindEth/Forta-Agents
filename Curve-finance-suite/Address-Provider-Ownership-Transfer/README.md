# Transfer Ownership Agent for Registry Contract

## Description

This agent detects `CommitNewAdmin` event emission in the address provider contract. 

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- CURVE-4
  - Fired when `CommitNewAdmin` event is emitted in the address provider contract. 
  - Severity is always set to "Medium" 
  - Type is always set to "Info" 
  - Metadata includes: 
    - `newAdmin`: new owner address.

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x5ddd201b8a21fdc77c79cde7b0466a6bf50e571346c4e308062e4cd4584c17e0
