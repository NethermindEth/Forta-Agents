# Vesper Maker Strategy Agent

## Description

This agent fetch all active pools alongside their strategies and filter `Maker` strategies through checking the whether the name of strategy includes `Maker` or not. Then, agent checks following cases and throws alerts;

- if `isUnderWater` returns true
- if `Collateral Ratio` is below `lowWater`
- if `Collateral Ratio` is above `highWater`
