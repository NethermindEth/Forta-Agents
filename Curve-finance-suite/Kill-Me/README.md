# Kill Me Agent

## Description

This agent detects successful `kill_me` calls on Curve-Stable-Swap contract.

## Supported Chains

- Ethereum

## Alerts

- CURVE-6
  - Fired when `kill_me` function is called. 
  - Severity is always set to "low" 
  - Type is always set to "suspicious"
  - Metadata includes:
    - `from`: Address that executes the`kill_me` call.
    - `contract_address`: Curve-Stable-Swap contract where the function was called.

## Test Data

The agent behaviour can be verified with the following transactions:

