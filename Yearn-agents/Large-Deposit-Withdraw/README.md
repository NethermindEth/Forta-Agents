# Large Deposit/Withdraw agent

## Description

This agent detects transactions with large Deposit/Withdrawals from Yearn Vaults
> Large is defined as a percentage of the maximum possible deposit and withdrawn.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- Yearn-6-1
  - Fired when large withdraws are detected
  - Severity is always set to "info"
  - Type is always set to "info"
  - metada contains 
    - `Vault`: Vault where the withdraw occured,
    - `From`: Address that executed the withdrawal,
    - `Amount`: Amount withdrawn,

- Yearn-6-2
  - Fired when large deposits are detected
  - Severity is always set to "info"
  - Type is always set to "info"
  - metada contains 
    - `Vault`: Vault where the deposit occured,
    - `From`: Address that executed the deposit,
    - `To`: Deposit recipient,
    - `Amount`: Amount deposited,
