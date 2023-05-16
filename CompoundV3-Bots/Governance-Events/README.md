# Governance Events Bot

## Description

This bot detects events related to governance actions in Compound v3 Comet
contracts, more specifically `PauseAction` and `WithdrawReserves`, as well
as `Approval`s with the contract as owner.

The Comet deployment addresses for each network can be configured in the
`agent.config.ts` file.

## Supported Chains

- Ethereum
- Polygon

More networks can easily be supported by adding the network parameters to
`agent.config.ts` and the chain ID to the `chainIds` field in `package.json`!

## Alerts

Below are the alerts that can be emitted from this bot. The title and
description of the findings, as well as the severity and type, can be found
and modified in the `src/finding.ts` file.

- COMP2-2-1
  - Fired when there's a pause action on a Comet contract
  - Severity is always set to "High"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain ID or name
    - `comet`: Address of the related Comet contract
    - `supplyPaused`: Status of supply pausing
    - `transferPaused`: Status of transfer pausing
    - `withdrawPaused`: Status of withdrawal pausing
    - `absorbPaused`: Status of absorption pausing
    - `buyPaused`: Status of buying pausing

- COMP2-2-2
  - Fired when there's a reserve withdrawal on a Comet contract
  - Severity is always set to "High"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain ID or name
    - `comet`: Address of the related Comet contract
    - `to`: Address of the withdrawal recipient
    - `amount`: Amount withdrawn

- COMP2-2-3
  - Fired when a Comet contract approves an ERC20 allowance for another contract
  - Severity is always set to "High"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain ID or name
    - `comet`: Address of the related Comet contract
    - `token`: Address of the related token
    - `spender`: Address of the allowance spender
    - `amount`: Allowance amount

## Test Data

No emission of these events was found on existing Comet contracts. Considering
this, besides the unit tests, which can be executed by running `npm run test`,
a PoC contract, which can be found at `PoC/GovernanceEventsPoc.sol`, was made
and deployed to the Sepolia network.

To test the bot against its data, first set up a Sepolia RPC in your
`forta.config.json` file. Then, run the following command to execute the bot
in a block range:

```
npm run range 3464652..3464657
```

The three findings should be emitted:
* A pause action finding on block `3464652`, setting the pause flags to
  `(false, true, false, true, false)`.
* A token approval finding on block `3464656` for `222` units of the token
  `0x3EF5...3370` to `0x1111...1111`.
* A reserve withdrawal finding on block `3464657` for a withdrawal of `444`
  reserve units to `0x3333...3333`.

The only detail to be mentioned about these findings is that the network
to name mapping used in the `chain` field is the same one used in the config
file, which is based on the networks supported by Forta, and there's also a
fallback to the chain ID. So, if these were executed on, e.g. mainnet, instead
of `"1"` the `chain` field value would be `"MAINNET"`.
