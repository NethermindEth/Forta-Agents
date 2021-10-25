# Vesper Maker Strategy Agent

## Description

This agent fetch all active pools alongside their strategies and filter `Maker` strategies through checking the whether the name of strategy includes `Maker` or not. Then, agent checks multiple cases and throws alert.

## Alerts

- Vesper-1
  - if `isUnderWater` returns true - Severity is `High`
  - if `Collateral Ratio` is below `lowWater` - Severity is `Critical`
  - if `Collateral Ratio` is above `highWater` - Severity is `Info`
  - The alert metadata includes:
    - `strategy`: The address of the Maker strategy
    - `Collateral Ratio`: The collateral ratio taken from `Collateral Manager(CM)`
    - `lowWater` or `highWater`: it is decided by `TYPE` of the alert
