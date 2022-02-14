# Pickle Range Management Monitor

## Description

Monitors the strategies to verify they are in range and earning fees.

## Supported Chains

- Polygon

## Alerts

- pickle-rmm
  - Fired when a pickle strategy tick is out of range
  - Severity is always set to "High"
  - Type is always set to "Info"
  - Metadata contains:
    - `strategy`: Address of the strategy out of range
    - `tick_lower`: The strategy `tick_lower` value
    - `tick_upper`: The strategy `tick_upper` value
    - `current_tick`: The `current_tick` in the strategy pool
