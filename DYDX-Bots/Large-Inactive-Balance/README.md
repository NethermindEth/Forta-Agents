# Large Inactive Balance in Safety Module.

## Description

This bot detects users with a large Inactive balance for the next Epoch in dYdX Safety Module.

> The bot can operate in two different modes, used to determine the threshold of a _large_ inactive balance.
>
> - `STATIC` mode refers to the bot using a static predefined threshold.
> - `PERCENTAGE` refers to setting the threshold as a percentage of the total staked tokens.

> In order to switch between the two modes, change `DYNAMIC_CONFIG` to `STATIC_CONFG` in agent.ts, L60.

## Supported Chains

- Ethereum

## Alerts

- DYDX-13
  - Fired when a user with large inactive balance is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `mode`: Indicates the operation mode of the bot. Can be `STATIC` or `PERCENTAGE`.
    - `staker`: Address of the staker with large inactive balance.
    - `inactiveBalance`: Inactive Balance of the staker.

## Test Data (Kovan)

The bot behaviour can be verified with the following test transactions, generated through our PoC contracts deployed on Kovan testnet:

> - `TestToken` contract address: `0x136Bb1ff78FBb538B001DC4A50551A088cD0e3CD`.
> - `TestSafetyModule`contract address: `0x1e1E83Da50b9c43314773F69B9746929cAC2177a`.

You can ajust `thresholdData` in `config.ts` for each mode in order to generate a finding.

- 0x64e76ccc213a8518db9feb6af32732f768fe29a960782089f6ba5167ee4a95f4.

  - `inactive balance`: 200 (20% of total staked).
  - `PERCENTAGE` mode generates a finding with `thresholdData` set to 20 or less.
  - `STATIC` mode generates a finding with `thresholdData` set to 200 or less.

- 0x7b45d9a338ce1ce98c0a349f1332bfaf3073673e1bcf628b6a1ee955374f63a8.
  - `inactive balance`: 500 (50% of total staked).
  - `PERCENTAGE` mode generates a finding with `thresholdData` set to 50 or less.
  - `STATIC` mode generates a finding with `thresholdData` set to 500 or less.
