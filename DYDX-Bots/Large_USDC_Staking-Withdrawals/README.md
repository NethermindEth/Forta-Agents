# Large Staking Deposit/Withdrawal Bot

## Description

This bot detects deposits and withdrawals in the Liquidity Moudle contract when the `amount` is high.
> High is set as a percentage of the total USDC staked.
> You can adjust the percentage by changing the const `THRESHOLD_PERCENTAGE` in **utils.ts**. 

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

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