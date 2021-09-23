# MakerDAO Governance Module Agent

## Description

This agent detects: 
- Transactions where a lift event occured in the Chief contract address with uknown addresses in the topics
- Blocks where the Chief hat address is an unknown address or to a different address.
- Blocks where the Chief hat address is changed or have less than 40000 MKR in approvals

> Chief contract address: `0x0a3f6849f78076aefaDf113F5BED87720274dDC0`

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- MakerDAO-GM-1
  - Fired when a transaction is reported
  - Severity is always set to "high" 
  - Type is always set to "suspicious"
  - The metadata contains the unknown address that cause the alert
- MakerDAO-GM-2
  - Fired when a block is reported
  - Severity is always set to "high" 
  - Type is always set to "suspicious"
  - The metadata can contains:
    - `hat` address (Always)
    - `previousHat` address (When the hat is changed)
    - `MKR` amount of the hat address (When MKR is below the threshold)
    - `threshold` amount of the hat address (When MKR is below the threshold)

## Test Data

The agent behaviour can be verified with the history of transactions of the Chief contract

