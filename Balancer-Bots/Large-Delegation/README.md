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

### Mainnet

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set an Ethereum Mainnet RPC url as
`jsonRpcUrl` in your `forta.config.json` file.

```
npm run block 14615003
```

This test configuration has the absolute threshold set to `10000` veBAL and the total supply threshold set to `1.5%`. Considering the delegator from a delegation that happened in this block had `~14281` veBAL and the total supply percentage of that was `~1.83%`, both findings were emitted.
