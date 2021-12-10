# Registry Remove Pool Agent

## Description
This agent detects when a pool has been removed from the Curve Registry

## Supported Chains

- Ethereum

## Alerts

- curve-13
  - Fired when `PoolRemoved` event is emitted by the Curve Registry contract
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - `pool_address`: The address of the pool removed from the registry

## Test Data

The agent behaviour can be verified with the following transaction:

- 0xe59a6c7ecae4e11cff91326347406e301e775999a98d6ee3d396e4e6cb20784f (event `PoolRemoved` emitted)
