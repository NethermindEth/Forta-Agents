# Impossible Finance - Swap Fee Parameter Updates 

## Description

This agent detects transactions where modifications in fee values of Impossible Finance V2 Pairs occurred.
> Check Impossible Finance V2 Pairs and Factory here https://github.com/ImpossibleFinance/impossible-swap-core
> You can update the Factory address to V2 Factory by changing `FACTORY` value in the agent file. 

## Supported Chains

- BSC

## Alerts

- IMPOSSIBLE-6-1
  - Fired when an `UpdatedTradeFees` event is emitted by an Impossible Finance V2 pair
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains:
    - `pair`: Address of the pair emitting the event
    - `oldFee`: Old trade fee value
    - `newFee`: New trade fee value

- IMPOSSIBLE-6-2
  - Fired when an `UpdatedWithdrawalFeeRatio` event is emitted by an Impossible Finance V2 pair
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains:
    - `pair`: Address of the pair emitting the event
    - `oldFee`: Old withdrawal fee ratio
    - `newFee`: New withdrawal fee ratio

## Test Data

There are no V2 pairs deployed right now, but the `PoC` contracts provided can be deployed in any
EVM compatible network to test the agent.
There is a `PoC` factory deployed on Goerli at `0xC7bBBf59a45E72f507Cf8c0D20B474195e761825`
