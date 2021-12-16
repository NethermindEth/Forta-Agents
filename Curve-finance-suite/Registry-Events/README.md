# Curve Registry Events

## Description

This agent detects the following events emitted by Curve Registry:

```
event PoolAdded:
    pool: indexed(address)
    rate_method_id: Bytes[4]

event PoolRemoved:
    pool: indexed(address)
```

## Supported Chains

- Ethereum

## Alerts

- CURVE-13-1
  - Fired when `PoolAdded` event is emitted in Curve Registry
  - Severity is always set to "info"
  - Type is always set to "info"
  - Mention contains all the event parameters

- CURVE-13-2
  - Fired when `PoolRemoved` event is emitted in Curve Registry
  - Severity is always set to "info"
  - Type is always set to "info"
  - Mention contains all the event parameters


## Test Data

- 0x75eb300094104ad1801b75b58833b6b55be2ff4f836c43cf366594d400c69dea (`PoolAdded`)
- 0xe59a6c7ecae4e11cff91326347406e301e775999a98d6ee3d396e4e6cb20784f (`PoolRemoved`)
