# Debt Strategies Agents

## Description

This agent detects two things: 
- A Maker Strategy's Collateralization Ratio is under Threshold 
- A Maker Strategy's tend function is called by its keeper

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- YEARN-2-1
  - Fired when a Maker Strategy has this property: getCurrentMakerVaultRatio() < collateralizationRatio() - rebalanceTolerance()
  - Severity is always set to "Medium".
  - Type is always set to "Info".
  - You can find the following information in the metadata: 
    - strategy: the address of the Maker strategy affected 
- YEARN-2-2
  - Fired when a Maker Strategy's tend function is called by its keeper
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - You can find the following function in the metadata:
    - strategy: the address of the Maker Strategy affected
