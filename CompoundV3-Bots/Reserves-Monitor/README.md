# Reserves Monitor Bot

## Description

This bot monitors reserves in Compound v3 `Comet` contracts. It emits an alert
if contract `reserves` reaches the `targetReserves`.

The bot is configurable through the `agent.config.ts` file, in which the Comet
addresses for each network can be set and an alert interval or cooldown can be
chosen to avoid alert flooding.

## Supported Chains

- Ethereum
- Polygon

More networks can easily be supported by adding the network parameters to
`agent.config.ts` and the chain ID to the `chainIds` field in `package.json`!

## Alerts

Below are the alerts that can be emitted from this bot. The title and
description of the findings, as well as the severity and type, can be found
and modified in the `src/finding.ts` file.

- COMP2-1-1
  - Fired when `reserves` reaches or exceeds the `targetReserves` in any of
  Comet contracts.
  - Severity is always set to "Medium"
  - Type is always set to "Info"
  - Metadata includes:
    - `chain`: Network chain ID or name
    - `comet`: Address of the Comet contract
    - `reserves`: Reserves amount of the Comet contract
    - `targetReserves`: Target reserves amount of the Comet contract

## Test Data

This scenario was not found on existing Comet contracts. Considering this, a
PoC contract, which can be found at `PoC/ReservesMonitorPoc.sol`, was made and
deployed to the Sepolia network.

To test the bot against its data, first set up a Sepolia RPC in your
`forta.config.json` file. Then, run the following command to execute the bot
in a block range:

```
npm run range 3466251..3466253
```

The finding should be emitted on 3466253, as then `reserves` is changed to
`10e18`, which is the same amount as `targetReserves`, so that
`uint(reserves) >= targetReserves`.

The only detail to be mentioned about this finding is that the network to name
mapping used in the `chain` field is the same one used in the config file,
which is based on the networks supported by Forta, and there's also a fallback
to the chain ID. So, if these were executed on, e.g. mainnet, instead of `"1"`
the `chain` field value would be `"MAINNET"`.
