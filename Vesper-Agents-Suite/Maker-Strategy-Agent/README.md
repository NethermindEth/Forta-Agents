# Vesper Maker Strategy Agent

## Description

This agent fetch all active pools alongside their strategies and filter `Maker` strategies through checking the whether the name of strategy includes `Maker` or not. Then, agent checks multiple cases and throws alert.

## Supporter Chains

- Ethereum

## Alerts

- Vesper-1

  - Maker Type Strategy isUnderWater Detection:

    - if `isUnderWater` returns true
    - Severity is `High`
    - Type is `Suspicious`

  - Maker Type Strategy Collateral Ratio < lowWater Detection:

    - if `Collateral Ratio` is below `lowWater`
    - Severity is `Critical`
    - Type is `Suspicious`

  - Maker Type Strategy Collateral Ratio > highWater Detection:

    - if `Collateral Ratio` is above `highWater`
    - Severity is `Info`
    - Type is `Info`

  - The alert metadata includes:
    - `strategy`: The address of the Maker strategy
    - `Collateral Ratio`: The collateral ratio taken from `Collateral Manager(CM)`
    - `lowWater` or `highWater`: it is decided by `TYPE` of the alert
