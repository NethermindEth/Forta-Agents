# Alpaca Guard Agent

## Description

This agent detects when a used DEX LP price deviate from Oracle price by a specific threshold.

## Supported Chains

- BSC

## Alerts

Describe each of the type of alerts fired by this agent

- ALPACA-2
  - Fired when a used DEX LP price deviate too much from Oracle price.
  - Severity is always set to "High".
  - Type is always set to "Info".
  - Metadata contains the following field:
    - `lpToken`: The address of the LP token which price deviate.
    - `priceDeviationDirection`: Indicates whether the price is too high or too low. 
