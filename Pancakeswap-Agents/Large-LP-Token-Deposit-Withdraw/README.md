# Large LP Token Deposit/Withdraw Bot

## Description

This bot detects large LP Token Deposit/Withdraw on Pancakeswap.

The bot can operate in two different modes, used to determine the threshold of a large deposit/withdrawal amount.

- `STATIC` mode refers to the bot using a static predefined threshold in number of tokens.
- `PERCENTAGE` mode refers to setting the threshold as a percentage of the total balance of tokens in the LP pool.

In order to switch between the two modes, change `DYNAMIC_CONFIG` to `STATIC_CONFIG` in agent.ts, L54.

## Supported Chains

- BSC

## Alerts

- CAKE-4-1

  - Fired when a transaction contains a `Deposit` above the threshold
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `user`: User who deposited
    - `token`: Name of the LP token
    - `pid`: The affected pool ID
    - `amount`: Amount deposited

- CAKE-4-2

  - Fired when a transaction contains a `Withdraw` above the threshold
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `user`: User who withdrew
    - `token`: Name of the LP token
    - `pid`: The affected pool ID
    - `amount`: Amount withdrawn

- CAKE-4-3
  - Fired when a transaction contains an `EmergencyWithdraw` above the threshold
  - Security is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `user`: User who withdrew
    - `token`: Name of the LP token
    - `pid`: The affected pool ID
    - `amount`: Amount withdrawn

## Test Data

The bot behaviour can be verified with the following transaction:

- [0x78f23a04e59e702c68092303f23a32c0f234621b1dac9500a7f1a0e4d9c69da4](https://bscscan.com/tx/0x78f23a04e59e702c68092303f23a32c0f234621b1dac9500a7f1a0e4d9c69da4) - Large Withdrawal
