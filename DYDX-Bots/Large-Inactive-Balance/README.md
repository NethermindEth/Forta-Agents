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
> - `TestSafetyModule` contract address: `0x1e1E83Da50b9c43314773F69B9746929cAC2177a`.

Adjust `thresholdData` in `config.ts` for each mode in order to generate a finding.

- 0xa1167ede6c4dbe95d9e95845160a6f1d40317ebd3d6dad0ad6304ada33870b60.

  - `inactive balance`: 200000000000000000000 (20% of total staked).
  - `PERCENTAGE` mode generates a finding with `thresholdData` set to 20 or less.
  - `STATIC` mode generates a finding with `thresholdData` set to 200000000000000000000 or less.

- 0x0b57c9f0847fe09109ed065e3d9c17b5433191d2b66830c54a5b9d3ba4c88ec3.
  - `inactive balance`: 500000000000000000000 (50% of total staked).
  - `PERCENTAGE` mode generates a finding with `thresholdData` set to 50 or less.
  - `STATIC` mode generates a finding with `thresholdData` set to 500000000000000000000 or less.
