# Large Inactive Balance in Safety Module.

## Description

This bot detect users with large Inactive balance for the next Epoch in dYdX Safety Module.

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

## Test Data

The bot behaviour can be verified with the following transactions (Mainnet):

- 0x278542214ed3fe02880fb8c1df2f0eed81f72f2f00bef41233aa2aa714c057b0
