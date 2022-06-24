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
    - `amount`: The delegator veBAL balance

- BAL-7-1
  - Fired when a large (in terms of veBAL total supply) delegation happens
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `delegator`: The delegator address
    - `delegate`: The delegate address
    - `amount`: The delegator veBAL balance
    - `supplyPercentage`: The percentage of the veBAL total supply represented by the delegator veBAL balance (in %)

## Test Data

### Mainnet

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set an Ethereum Mainnet RPC url as
`jsonRpcUrl` in your `forta.config.json` file.

```
npm run block 14615003
```

This test configuration has the absolute threshold set to `10000e18` and the total supply threshold set to `1.5%`. Considering the delegator from a delegation that happened in this block had `~14281` veBAL and the total supply percentage of that was `~1.83%`, both findings were emitted.

### Kovan Testnet (PoC)

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set a Kovan Testnet RPC url as `jsonRpcUrl`
in your `forta.config.json` file.

```
npm run block 32345000,32345003,32345005
```

This test configuration has the absolute threshold set to `100` and the total supply percentage threshold set to `20%`. As noted in the PoC at `PoC/MockDelegation.sol`, there should be:
- No findings in the block `MockDelegation.test0()` is called (`32345000`).
- One `BAL-7-1` finding in the block `MockDelegation.test1()` is called (`32345003`), since the delegation amount is equal to the absolute threshold.
- One `BAL-7-1` and one `BAL-7-2` finding in the block `MockDelegation.test2()` is called (`32345005`), since the delegation amount is greater than the absolute threshold and its percentage in relation to the total supply is equal to the total supply percentage threshold.
