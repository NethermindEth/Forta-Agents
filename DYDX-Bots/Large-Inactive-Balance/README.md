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

## Test Data (Kovan)

The bot behaviour can be verified with the following test transactions,generated through our PoC contracts deployed on Kovan testnet:

> - `TestToken` contract address: `0x136Bb1ff78FBb538B001DC4A50551A088cD0e3CD`.
> - `TestSafetyModule`contract address: `0x267CaE324d5850D84EcA39E2F3C0A8003d3c2F02`.

You can ajust `thresholdData` in `config.ts` for each mode in order to generate a finding.

- 0xa697dac3317c9fd5e73646066d9b76a864d3b995d0d957c2b46655848d773b64.

  - `inactive balance`: 200 (20% of total staked).
  - `PERCENTAGE` mode generates a finding with `thresholdData` set to 20 or less.
  - `STATIC` mode generates a finding with `thresholdData` set to 200 or less.

- 0xa96665240ade9736398110b35746312224ab995ea20ec6f3a191e32c67c7e563.
  - `inactive balance`: 500 (50% of total staked).
  - `PERCENTAGE` mode generates a finding with `thresholdData` set to 50 or less.
  - `STATIC` mode generates a finding with `thresholdData` set to 500 or less.
