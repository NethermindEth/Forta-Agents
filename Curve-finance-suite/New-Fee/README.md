# New Fee Agent

## Description

This agent detects calls to `apply_new_fee` function in Curve Pool Owner Proxy
> 0xeCb456EA5365865EbAb8a2661B0c503410e9B347

## Supported Chains

- Ethereum

## Alerts

- curve-14
  - Fired when `apply_new_fee` function is called in the Curve DAO contract
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - `affected_pool`: The `_pool` argument used in the call
    - `sender`: Address of the account that call the function

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x0ccbffa23dff7d7c47dcdaed14c3d98aab5e4c63d531d8e243365745cbb1484e (call to `apply_new_fee`):
