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

