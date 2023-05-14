# Reserves Monitor Bot

## Description

This bot monitors reserves in Compound III `Comet` contracts. It emits an alert if contract `reserves` reaches the `targetReserves`.
Note that the bot is configurable through the `agent.config.ts` file.

## Supported Chains

- Ethereum
- Polygon

## Alerts

- COMP2-1-1
  - Fired when `reserves` reaches or exceeds the `targetReserves` in any of comet contracts.
  - Severity is always set to "Medium"
  - Type is always set to "info"
  - Metadata includes:
    - `comet`: Address of the Comet contract
    - `reserves`: Reserves amount of the Comet contract
    - `targetReserves`: Target reserves amount of the Comet contract

## Test Data

This scenario was not found on existing Comet contracts. Considering this, a
PoC contract, which can be found at `PoC/ReservesMonitorPoc.sol`, was made and
deployed to the Sepolia network.

To test the bot against its data, first set up a Sepolia RPC in your
`forta.config.json` file. Then, build the bot using `npm run build` and run
the following command to execute the bot in a block range:

```
npx forta-agent run --range 3466251..3466253
```

The finding should be emitted on 3466253, as then `reserves` is changed to
`10e18`, which is the same amount as `targetReserves`, so that
`uint(reserves) >= targetReserves`.

The only detail to be mentioned about this finding is that the network to name
mapping used in the `chain` field is the same one used in the config file,
which is based on the networks supported by Forta, and there's also a fallback
to the chain ID. So, if these were executed on, e.g. mainnet, instead of `"1"`
the `chain` field value would be `"MAINNET"`.
