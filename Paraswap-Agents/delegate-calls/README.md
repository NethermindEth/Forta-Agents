# Delegated Function Call Agent

## Description

This agent detects delagated calls by the contract `AugustusSwapper` (see [here](https://developers.paraswap.network/smart-contracts#augustusswapper) for more details)

## Supported Chains

- Ethereum
- Polygon
- Binance Smart Chain
- Avalanche
- Fantom
- Ropsten

## Alerts

- PARASWAP-3-1
  - Fired when `AugustusSwapper` makes a delegated call to a contract with the role `ROUTER_ROLE`
  - Severity is set to "Info"
  - Type is set to "Info"
  - Metadata:
    - `logicContract`: The contract called by the `AugustusSwapper` contract through a `delegatecall`

- PARASWAP-3-2
  - Fired when `AugustusSwapper` makes a delegated call to a contract without the role `ROUTER_ROLE`
    - This means that the contract is foreign to the protocol and unknown code is being executed
  - Severity is set to "High"
  - Type is set to "Exploit"
  - Metadata:
    - `logicContract`: The contract called by the `AugustusSwapper` contract through a `delegatecall`

- PARASWAP-3-3
  - Fired when `AugustusSwapper` makes a delegated call to a contract and it cannot be verified if the contract has the role `ROUTER_ROLE`
    - This will only occur if the `ethers` call to `AugustusSwapper.hasRole()` fails. This is very unlikely to ever fire however in the case that a delegated call is made while the agent's endpoint is having issues, the agent does not know if the contract is trusted (has role `ROUTER_ROLE`) or is not trusted (doesn't have role `ROUTER_ROLE`). It would then be recommended for the Paraswap team to manually verify if the `logicContract` has the role `ROUTER_ROLE` or not.
  - Severity is set to "Medium"
  - Type is set to "Suspicious"
  - Metadata:
    - `logicContract`: The contract called by the `AugustusSwapper` contract through a `delegatecall`

## Test Data

The agent behaviour can be verified with the following transactions:
- On Paraswap protocol (Ethereum):
  - `0x94c0a7cd60587e03dfd92b5ee200d16cef7834c10267fe12dd178f6659f1c702` (delegatecall to a `ROUTER_ROLE` address)
- On testing protocol (Ropsten):
  - Not yet implemented
