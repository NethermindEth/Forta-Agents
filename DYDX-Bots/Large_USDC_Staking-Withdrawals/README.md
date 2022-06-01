# Large Staking Deposit/Withdrawal Bot

## Description

This bot detects deposits and withdrawals in the Liquidity Module contract when the `amount` is high.

> The bot can operate in two different modes, used to determine the threshold of a _large_ deposit/withdrawal amount.
>
> - `STATIC` mode refers to the bot using a static predefined threshold.
> - `PERCENTAGE` refers to setting the threshold as a percentage of the total staked tokens.

> In order to switch between the two modes, change `DYNAMIC_CONFIG` to `STATIC_CONFG` in agent.ts, L61.

## Supported Chains

- Ethereum

## Alerts

- DYDX-14-1
  - Fired when `Staked` event is emitted with an `amount` that exceeds the threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `staker`: The address who will receive the stake.
    - `spender`: The address who can spend the stake.
    - `amount`: The amount to stake.
- DYDX-14-2
  - Fired when `WithdrewStake` event is emitted with an `amount` that exceeds the threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `staker`: The `msg.sender ` that initiated the `withdrawStake` call.
    - `recipient`: The address that should receive the funds.
    - `amount`: The amount withdrawn from the sender's inactive balance.
- DYDX-14-3
  - Fired when `WithdrewDebt` event is emitted with an `amount` that exceeds the threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `staker`: The `msg.sender` that initiated the `withdrawDebt` call.
    - `recipient`: The address that should receive the funds.
    - `amount`: The token amount withdrawn from the sender's debt balance.
    - `newDebtBalance`: The balance after `amount` has been withdrawn.

## Test Data

The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0x9bc9a7D5ed679C17abECE73461Cbba9433B541c5](https://kovan.etherscan.io/address/0x9bc9a7d5ed679c17abece73461cbba9433b541c5) - `TestToken`.

[0x5b7eA2cEaAA5EcC511B453505d260eFB1fBa4fDF](https://kovan.etherscan.io/address/0x5b7eA2cEaAA5EcC511B453505d260eFB1fBa4fDF) - `TestModule`.

You can ajust `thresholdData` in `config.ts` for each mode in order to generate a finding.
To test specific event emissions, use the following transactions on the Kovan ETH testnet:

[0x308518b82a939e20b47d5b6b4c11fd16a7c530468e216086d14dcc9b5998f377](https://kovan.etherscan.io/tx/0x308518b82a939e20b47d5b6b4c11fd16a7c530468e216086d14dcc9b5998f377) - `Staked` event.

- `amount`: 25000000000000000000 (25% of total staked).
- `PERCENTAGE` mode generates a finding with `thresholdData` set to 25% or less.
- `STATIC` mode generates a finding with `thresholdData` set to 25000000000000000000 or less.

[0xc6a122dec8b4ab44fce024cd0ab5519d52ee3d4995ae52f2a5c6884fe1c8ded4](https://kovan.etherscan.io/tx/0xc6a122dec8b4ab44fce024cd0ab5519d52ee3d4995ae52f2a5c6884fe1c8ded4) - `WithdrewStake` event.

- `amount`: 25000000000000000000 (25% of total staked).
- `PERCENTAGE` mode generates a finding with `thresholdData` set to 25% or less.
- `STATIC` mode generates a finding with `thresholdData` set to 25000000000000000000 or less.

[0x10bba6b7581b5a4f2b7e5aa7a4d8b57e31264c2ed0e510724d4ae3f730bc68a2](https://kovan.etherscan.io/tx/0x10bba6b7581b5a4f2b7e5aa7a4d8b57e31264c2ed0e510724d4ae3f730bc68a2) - `WithdrewDebt` event.

- `amount`: 25000000000000000000 (25% of total staked).
- `PERCENTAGE` mode generates a finding with `thresholdData` set to 25% or less.
- `STATIC` mode generates a finding with `thresholdData` set to 25000000000000000000 or less.
