# Pools Ramp agent

## Description

This agent detects `RampA` & `StopRampA` event emisions in Curve Finance Pools

```python
event RampA:
  old_A: uint256
  new_A: uint256
  initial_time: uint256
  future_time: uint256

event StopRampA:
  A: uint256
  t: uint256
```

## Supported Chains

- Ethereum

## Alerts

- CURVE-10-1
  - Fired when a `RampA` event is emitted in a Curve Pool
  - Severity is always set to "info" 
  - Type is always set to "info"
  - Metadata contains all the parameters of the event

- CURVE-10-2
  - Fired when a `StopRampA` event is emitted in a Curve Pool
  - Severity is always set to "info" 
  - Type is always set to "info"
  - Metadata contains all the parameters of the event
