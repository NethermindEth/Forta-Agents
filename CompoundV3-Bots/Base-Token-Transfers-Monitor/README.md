# Base Token Transfers Monitor Bot

## Description

This bot detects when a `Transfer` event on the base contract is directed to a
Compound v3 Comet contract, but it's not associated with a `BuyCollateral` or
`Supply` event.

## Supported Chains

- Ethereum
- Polygon

More networks can easily be supported by adding the network parameters to
`agent.config.ts` and the chain ID to the `chainIds` field in `package.json`!

## Alerts

- COMP2-3-1
  - Fired when a `Transfer` event is emitted on a base asset, directed to a
  Comet contract, but there's no matching `BuyCollateral` or `Supply` event.
  - Severity is always set to "Medium"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network ID or name
    - `comet`: Address of the Comet contract that received the transfer
    - `sender`: The sender of the transfer
    - `transferAmount`: Amount that was transfered to the Comet contract

## Test Data

To test this bot against real data, beyond the unit tests, which can be
executed through `npm run test`, set up an Ethereum Mainnet RPC on your
`forta.config.json` file and run:

```
npm run tx 0x650fe00b758d9e8a3467bfbba7bed2035c03603080558d47973e6c0e6b80e45a
```

This transaction is the execution of the [Initialize Compound III (USDC on Ethereum)](https://compound.finance/governance/proposals/116)
proposal, which included the transfer of 500000 USDC as initial reserves. As
expected, since there is no matching `Supply` or `BuyCollateral` event
emission from the `cUSDCv3` contract, a finding is emitted.
