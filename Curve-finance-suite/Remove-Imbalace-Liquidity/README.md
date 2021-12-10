# Remove Imbalance Liquidity Agent

## Description

This agent detects `RemoveLiquidityImbalance` event emission on 3Pool StableSwap Exchange contract. Note that you can change the Pool address by updating the const `CONTRACT_ADDRESS`.

## Supported Chains

- Ethereum

## Alerts

- CURVE-2
  - Fired when `RemoveLiquidityImbalance` event is emitted.
  - Severity is always set to "low" 
  - Type is always set to "info" 
  - Metadata contains: 
    - `pool_address`: address of the pool contract where `RemoveLiquidityImbalance` event was emitted.
    - `token_supply`: token supply in the pool after removing liquidity.


## Test Data

The agent behaviour can be verified with the following transactions:

- 0x70e10af12eea47e5439284cad1f7c3c46607db9baabcc4fa657eebe671ec11c4


