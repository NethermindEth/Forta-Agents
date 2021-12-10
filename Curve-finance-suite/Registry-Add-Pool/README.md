# Registry Add Pool Agent

## Description
This agent detects when a pool has been added to the Curve Registry

## Supported Chains

- Ethereum

## Alerts

- curve-13
  - Fired when `PoolAdded` event is emitted by the Curve Registry contract
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - `pool_address`: The address of the pool added to the registry

## Test Data

The agent behaviour can be verified with the following transaction:

- 0x75eb300094104ad1801b75b58833b6b55be2ff4f836c43cf366594d400c69dea (event `PoolAdded` emitted)
