# Vesper Maker Strategy Agent

## Description

This agent fetch all active pools alongside their strategies and filter `Maker` strategies through checking the whether the name of strategy includes `Maker` or not. Then, agent checks multiple cases and throws alert.

## Supporter Chains

- Ethereum

## Alerts

- Vesper-1-1

  - Maker Type Strategy isUnderWater Detection:

    - if `isUnderWater` returns true
    - Severity is `Info`
    - Type is `Suspicious`
    - The alert metadata includes:
      - `strategy`: The address of the Maker strategy

  - Maker Type Strategy Collateral Ratio < lowWater Detection:

    - if `Collateral Ratio` is below `lowWater`
    - Severity is `Critical`
    - Type is `Suspicious`
    - The alert metadata includes:
      - `strategy`: The address of the Maker strategy
      - `Collateral Ratio`: The collateral ratio taken from `Collateral Manager(CM)`
      - `lowWater`: The `lowWater` value

  - Maker Type Strategy Collateral Ratio > highWater Detection:

    - if `Collateral Ratio` is above `highWater`
    - Severity is `Info`
    - Type is `Info`
    - The alert metadata includes:
      - `strategy`: The address of the Maker strategy
      - `Collateral Ratio`: The collateral ratio taken from `Collateral Manager(CM)`
      - `highWater`: The `highWater` value

- Vesper-1-2

  - Stability Fee Updates Detection:
    - throws alert when stability fee changes in the collaterals of maker strategies
    - Severity is `Info`
    - Type is `Info`
    - The alert metadata includes:
      - `strategy`: The address of the Maker strategy
      - `collateralType`: The collateral type of strategy
