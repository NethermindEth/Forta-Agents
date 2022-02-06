# Flash Loan Agent

## Description

This agent detects if a flash loan has been taken
This agent detects flashloans through the function `swap` on pairs generated through `Swap Factory V1`

## Supported Chains

- Binance Smart Chain

## Alerts

Describe each of the type of alerts fired by this agent

- IMPOSSIBLE-3
  - Fired when a transaction involved a flash loan through an IF swap
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata field
    - `amount0Out`: The amount of token0 that was sent to `to`
    - `amount1Out`: The amount of token1 than was sent to `to`
    - `to`: The address that receives the tokens and executes the flashloan
    - `data`: The data to be passed as an argument in the call to `stableXCall` on the address `to`

## Test Data

The test transaction provided is on the Ethereum Network with the contract `Uniswap Factory V2` since the Impossible Finance factory and swap structure is very similar. 
When testing, set the variable `testing` in the agent to `true` and ensure that the Ethereum Network is used in `~/.forta/forta.config.json`.

 - 0x284101ec1389344b360d10caa9a5c8be8fc75fe87c0a3273a0716539b5357ffd (Ethereum network)
