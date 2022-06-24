# Balancer Large Delegation Bot

## Description

This bot detects "large" (in terms of an absolute token amount threshold or a total supply percentage threshold) veBAL
delegations by monitoring delegations through the `DelegateRegistry` contract and checking veBAL balances.

The bot behavior can be configured in the `src/agent.config.ts` file.

## Supported Chains

- Ethereum

## Alerts

- BAL-7-1
  - Fired when a large (in absolute terms) delegation happens
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `delegator`: The delegator address
    - `delegate`: The delegate address
    - `amount`: The delegation amount in veBAL

- BAL-7-1
  - Fired when a large (in terms of veBAL total supply) delegation happens
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `delegator`: The delegator address
    - `delegate`: The delegate address
    - `amount`: The delegation amount in veBAL
    - `supplyPercentage`: The percentage of the totalSupply represented by the delegation amount (in %)

## Test Data

