# Balancer Large Delegation Bot

## Description

This bot detects "large" veBAL delegations by monitoring delegations through the `DelegateRegistry` contract and checking veBAL balances.

> "Large" is defined in terms of an absolute token amount threshold or a total supply percentage threshold.

The bot behavior can be configured in the `src/agent.config.ts` file. Minimum percentage of veBAL total supply that, when delegated, leads to a finding (optional) (in % set to supplyPercentageThreshold: "50.5", // 50.5%

## Supported Chains

- Ethereum

## Alerts

- BAL-8-1

  - Fired when a large (in absolute terms) delegation happens
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `delegator`: The delegator address
    - `delegate`: The delegate address
    - `amount`: The delegator veBAL balance

- BAL-8-2
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
> `jsonRpcUrl` in your `forta.config.json` file.

```
npm run tx 0x91b9f778e0a66705aac10f6a6ececcd2588759adc6baa077e34b472bdc31801e
```

This test configuration has the absolute threshold set to `10000e18` and the total supply threshold set to `1.5%`. Considering the delegator from a delegation that happened in this transaction had `~14281` veBAL and the total supply percentage of that was `~1.83%`, both findings were emitted.

### Kovan Testnet (PoC)

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set a Kovan Testnet RPC url as `jsonRpcUrl`
> in your `forta.config.json` file.

```
npm run tx 0x39928e6b16ed5a47d23e481f0d8a338ced7a79b145767796ffa296bbb510a71e,0xa78cc4d5dcb81f53e4b45b95bf7eb7733f72d1a50612e1416da2fd75e97ac312, 0xfaf24d423e40625e0574da90fe0b12f4d194107a69a561b01189f781b0bc12dc
```

This test configuration has the absolute threshold set to `100` and the total supply percentage threshold set to `20%`. As noted in the PoC at `PoC/MockDelegation.sol`, there should be:

- No findings in the transaction `MockDelegation.test0()` is called (`0x39928e6b16ed5a47d23e481f0d8a338ced7a79b145767796ffa296bbb510a71e`).
- One `BAL-8-1` finding in the transaction `MockDelegation.test1()` is called (`0xa78cc4d5dcb81f53e4b45b95bf7eb7733f72d1a50612e1416da2fd75e97ac312`), since the delegation amount is equal to the absolute threshold.
- One `BAL-8-1` and one `BAL-8-2` finding in the transaction `MockDelegation.test2()` is called (`0xfaf24d423e40625e0574da90fe0b12f4d194107a69a561b01189f781b0bc12dc`), since the delegation amount is greater than the absolute threshold and its percentage in relation to the total supply is equal to the total supply percentage threshold.
