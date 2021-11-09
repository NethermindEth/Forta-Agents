# Yearn Vault Idle Funds

## Description

This agent detects yearn vaults with idle funds. The findings will be reported only once per 265 blocks (1 hour aproximately) or if the vaults
goes to a correct state (no too much idle funds) and goes to the wrong state again after that.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- Yearn-5
  - Fired when a Yearn Vault has at least 25% of its total assets idle.
  - Severity is always set to "info".
  - Type is always set to "info".
  - In the finding metadata you can find:
    - `YearnVault`: The address of the Yearn Vault with idle funds.
    - `IdleFundsPercent`: Percent of the total assets that are idle.
