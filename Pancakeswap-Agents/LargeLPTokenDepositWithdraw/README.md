# Large LP Token Deposit/Withdraw Bot

## Description

This bot detects large LP Token Deposit/Withdraw on Pancakeswap

## Supported Chains

- BSC

## Alerts

Describe each of the type of alerts fired by this bot

- CAKE-4-1
  - Fired when a transaction contains a Deposit above the threshold
  - Severity is always set to "info" 
  - Type is always set to "info" 
  - Metadata includes:
    - user: user who deposited
    - token: name of the LP token
    - pid: the affected pool ID
    - amount: amount deposited
- CAKE-4-2
  - Fired when a transaction contains a Withdraw above the threshold
  - Severity is always set to "info" 
  - Type is always set to "info" 
  - Metadata includes:
    - user: user who withdrew
    - token: name of the LP token
    - pid: the affected pool ID
    - amount: amount withdrew
- CAKE-4-3
  - Fired when a transaction contaisn an EmergencyWithdraw above the threshold
  - Security is always set to "info"
  - Type is always set to "info"
  - Metadata includes:
    - user: user who withdrew
    - token: name of the LP token
    - pid: the affected pool ID
    - amount: amount withdrew

## Test Data

The bot behaviour can be verified with the following transactions:
- 0xba32a973b10034ebd97dedc2259534b86c2d6c80de7dec70a347e210e3bfd869 - Large Deposit (when % threshold is set to 0.01%)
- 0x78f23a04e59e702c68092303f23a32c0f234621b1dac9500a7f1a0e4d9c69da4 - Large Withdrawal (when % threshold is set to 2%)
