# Withdrawal Root Hash Publish Agent

## Description

This agent detects a `WithdrawalRootHashAddition` event emission from `FlexaCollateralManager` contract.

## Supported Chains

- Ethereum

## Alerts

- FLEXA-3
  - Fired when a the contract emits `WithdrawalRootHashAddition` event.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata fields
    - timestamp: Raw timestamp of the transaction
    - timeUTC: Timestamp of the transaction in UTC
    - rootHash: Event's `rootHash` argument
    - nonce: Event's `nonce` argument

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x4407e5e241fb606b766cf0b87302cc3ff59e8586639953b769dd395fd1042466
- 0x788946a0e8192a3eb95e6eb1faf0804c4d591ffabcffd9a9fd64fcc50d7c88a1
