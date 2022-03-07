# Flash Loan Agent

## Description

This agent detects flashloans through the function `swap` on pairs generated through `Swap Factory V1`

## Supported Chains

- Binance Smart Chain

## Alerts

- IMPOSSIBLE-5
  - Fired when a transaction involved a flash loan through an IF swap
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata fields
    - `amount0Out`: The amount of token0 that was sent to `to`
    - `amount1Out`: The amount of token1 than was sent to `to`
    - `to`: The address that receives the tokens and executes the flashloan
    - `data`: The data to be passed as an argument in the call to `stableXCall` on the address `to`

## Test Data

The test transactions provided are on the Ethereum Network with the contract `Uniswap V2 Factory` since the Impossible Finance factory and swap structure is very similar.
If you would like to test this agent with these transactions, change the `SWAP_FACTORY_ADDRESS` variable to the address `0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f` which is the Uniswap V2 Factory contract address on the Ethereum chain.

 - 0x284101ec1389344b360d10caa9a5c8be8fc75fe87c0a3273a0716539b5357ffd (Ethereum network, generates a finding)
 - 0xf2ce09014e695e14d6261a3716dcee90bb143cefde2fe2a43189ef9f3103f6b9 (Ethereum network, generates a finding)
