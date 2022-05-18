# Large DYDX Staking Deposit/Withdrawal Bot

## Description

This bot detects DYDX deposits and withdrawals in the Safety Module contract when the `underlyingAmount` is high.

> The bot can operate in two different modes, used to determine the threshold of a _large_ deposit/withdrawal amount.
>
> - `STATIC` mode refers to the bot using a static predefined threshold.
> - `PERCENTAGE` refers to setting the threshold as a percentage of the total staked tokens.

> In order to switch between the two modes, change `DYNAMIC_CONFIG` to `STATIC_CONFG` in agent.ts, L55.

## Supported Chains

- Ethereum

## Alerts

- DYDX-11-1
  - Fired when `Staked` event is emitted with an `underlyingAmount` that exceeds the threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `staker`: The address who will receive the stake.
    - `spender`: The address who can spend the stake.
    - `underlyingAmount`: The amount of underlying token staked.
    - `stakeAmount`: The amount of stake deposited to the sender's inactive balance.
  
- DYDX-11-2
  - Fired when `WithdrewStake` event is emitted with an `underlyingAmount` that exceeds the threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `staker`: The `msg.sender ` that initiated the `withdrawStake` call.
    - `recipient`: The address that should receive the funds.
    - `underlyingAmount`: The amount of underlying token staked.
    - `stakeAmount`: The amount of stake withdrawn from the sender's inactive balance.

## Test Data

The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0x3A10842939B3B9B7C5038D7d985AD7B01A4a9454](https://kovan.etherscan.io/address/0x3A10842939B3B9B7C5038D7d985AD7B01A4a9454) - `TestProxy`.

[0xBC86cD962461B669136992a6a344bedDcff347F3](https://kovan.etherscan.io/address/0xBC86cD962461B669136992a6a344bedDcff347F3) - `TestImplementation`.

[0x74134f0a4639f8124a0D3203AEA4C72843f02162](https://kovan.etherscan.io/address/0x74134f0a4639f8124a0D3203AEA4C72843f02162) - `TestToken`.


You can ajust `thresholdData` in `config.ts` for each mode in order to generate a finding.

- [0x4964c3b9b161ba667cd001f05a21c2e21b65046c6e493117df31b736846b01ff](https://kovan.etherscan.io/tx/0x4964c3b9b161ba667cd001f05a21c2e21b65046c6e493117df31b736846b01ff) - `Staked`.

  - `underlyingAmount`: 700,000 (20% of total staked).
  - `PERCENTAGE` mode generates a finding with `thresholdData` set to 20 or less.
  - `STATIC` mode generates a finding with `thresholdData` set to 700,000 or less.

- [0x2134215fefff10aed3bca8377ef153069f563001a40717c8b625a5370fcb7d55](https://kovan.etherscan.io/tx/0x2134215fefff10aed3bca8377ef153069f563001a40717c8b625a5370fcb7d55) - `WithdrewStake`.

  - `underlyingAmount`: 700,000 (20% of total staked).
  - `PERCENTAGE` mode generates a finding with `thresholdData` set to 20 or less.
  - `STATIC` mode generates a finding with `thresholdData` set to 700,000 or less.