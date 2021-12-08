# Curve DAO Kill Gauge

## Description

This agent detect when Curve DAO tries to kill a Gauge.

## Supported Chains

- Ethereum

## Alerts

- curve-8
  - Fired when Curve DAO call `set_killed` function with `true` as argument.
  - Severity is always set to "Medium"
  - Type is always set to "Info"
  - Metadata contains:
    - `gaugeKilled`: Contract where the method was called.
