# New Fee Agent

## Description

This agent detects a change in fees to a Curve BasePool or MetaPool by the Curve DAO

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- CURVE-2
  - Fired when `set_new_fee` function is called in the Curve DAO contract
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - `affected_pool`: The address of the pool that emitted the event

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x0ccbffa23dff7d7c47dcdaed14c3d98aab5e4c63d531d8e243365745cbb1484e (call to `set_new_fee`):
