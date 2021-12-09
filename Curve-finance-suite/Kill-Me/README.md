# Kill Me Agent

## Description

This agent detects successful `kill_me` calls on 3Pool Stable-Swap contract. Note that you can specify the contract to observe by changing the address on const `STABLE_SWAP_CONTRACT_ADDRESS`. 

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
