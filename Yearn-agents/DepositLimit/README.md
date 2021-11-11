# Yearn Vault Deposit Limit Agent.

## Description

This agent detects Yearn Vaults with a total ammount of assets too close to its deposit limit. The agent will only report findings for the same vault every at least 265 blocks (1 hour aproximately), or if the vault was in a correct state in the previous block analyzed.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- Yearn-4
  - Fired when a Yearn Vault has more total assets than 90% of its deposit limit.
  - Severity is always set to "info".
  - Type is always set to "info".
  - In the metadata you can find the following data:
    - `YearnVault`: The address of the vault.
    - `DepositLimit`: The deposit limt of the vault.
    - `TotalAssets`: The ammount of assets currently in the vault.

