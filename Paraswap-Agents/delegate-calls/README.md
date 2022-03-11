# Delegated Function Call Agent

## Description

This agent detects delagated calls on the Paraswap protocol

## Supported Chains

- Ethereum
- BSC

## Alerts

- PARASWAP-3-1
  - Fired when a Paraswap makes a delegated call to a trusted contract with the role `ROUTER_ROLE`
  - Severity is set to "Info"
  - Type is set to "Info"
  - Metadata:
    - `logicContract`: The contract called by the Paraswap contract through a `delegatecall`

- PARASWAP-3-2
  - Fired when a Paraswap makes a delegated call to an unknown contract
  - Severity is set to "High"
  - Type is set to "Exploit"
  - Metadata:
    - `logicContract`: The contract called by the Paraswap contract through a `delegatecall`

## Test Data

The agent behaviour can be verified with the following transactions:
- On Paraswap protocol (Ethereum):
  - 0x94c0a7cd60587e03dfd92b5ee200d16cef7834c10267fe12dd178f6659f1c702 (delegatecall to a `ROUTER_ROLE` address)
- On testing protocol (Ropsten):
  - Not yet implemented

