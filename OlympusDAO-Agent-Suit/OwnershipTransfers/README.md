# OlympusDAO treasury ownership transfer monitor

## Description

This agent detects Ownership transfer events in OlympusDAO treasury contract
> Contract: 0x31F8Cc382c9898b273eff4e0b7626a6987C846E8

## Supported Chains

- Ethereum

## Alerts

- olympus-treasury-4-1
  - Fired when a transaction emit `OwnershipPushed` event
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains:
    - `currentOwner`: The current treasury owner
    - `proposedOwner`: The new owner proposed

- olympus-treasury-4-2
  - Fired when a transaction emit `OwnershipPulled` event
  - Severity is always set to "High" 
  - Type is always set to "Info" 
  - Metadata contains:
    - `previousOwner`: The previous treasury owner
    - `newOwner`: The new owner


## Test Data

The agent behaviour can be verified with the following transactions:

- 0xdefe17d976a59c1bb732d653b7259b3792e9df8345fb4ec73e37ddfdb0aeaeb5 (OwnershipPushed)
