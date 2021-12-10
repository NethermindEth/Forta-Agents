# UnkillMe Agent

## Description

This agent detects when Curve Pool Owner calls `unkill_me` functions.

## Supported Chains

- Ethereum

## Alerts

- CURVE-12
  - Fired when Curve Pool Owner calls `unkill_me` function.
  - Severity is always set to "info".
  - Type is always set to "info".
  - Metadata contains:
    - `UnkillPool`: Contract where `unkill_me` was called.
