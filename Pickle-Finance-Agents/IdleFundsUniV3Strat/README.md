# UniswapV3 Strategies Idle Funds

## Description

This agent detects when an UniswapV3 strategy has too much idle funds.

## Supported Chains

- Polygon

## Alerts

Describe each of the type of alerts fired by this agent

- PICKLE-8
  - Fired when an UniswapV3 strategy has too much idle funds. There is a threshold in the `agent.ts` file for defining `too much`.
  - Severity is always set to "Info". 
  - Type is always set to "Info".
  - The metadata contains:
    - `strategy`: The strategy with too much idle funds.
    - `idleFunds`: The percent of the vault that is Idle.
