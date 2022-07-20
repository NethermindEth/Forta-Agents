# Large LP Token Deposit/Withdraw Bot

## Description

This bot detects large LP Token Deposit/Withdraw on Pancakeswap.

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
    - `amount`: Amount withdrew

- CAKE-4-3
<<<<<<< HEAD
  - Fired when a transaction contains an EmergencyWithdraw above the threshold
  - Security is always set to "info"
  - Type is always set to "info"
=======
  - Fired when a transaction contains an `EmergencyWithdraw` above the threshold
  - Security is always set to "Info"
  - Type is always set to "Info"
>>>>>>> d45940d618277be5d828517747ba1f3f333c3c98
  - Metadata includes:
    - `user`: User who withdrew
    - `token`: Name of the LP token
    - `pid`: The affected pool ID
    - `amount`: Amount withdrew

## Test Data

The bot behaviour can be verified with the following transaction:

- 0x78f23a04e59e702c68092303f23a32c0f234621b1dac9500a7f1a0e4d9c69da4 - Large Withdrawal 

