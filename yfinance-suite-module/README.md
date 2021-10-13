# Agent for checking Yearn Vaults

## Description

This agent check listed yearn vaults for finding multiple suspicious behaviour.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- NETHFORTA-23-1
  - Fired when a transaction involved with a vault has a big value
  - Metadata contains the strategy's address.
  
- NETHFORTA-23-2
  - Fired when the "Emergency Shutdown" event is logged.
  - The type is always suspicious.
  - The severity is alway medium.
  - The metadata contains the address of the Yearn Vault involved.


- NETHFORTA-23-3
  - Fired when the "Strategy Migrated" event is logged.
  - The type is always suspicious.
  - The severity is alway medium.
  - The metadata contains the address of the Yearn Vault involved.

- NETHFORTA-23-4
  - Fired when the "Strategy Revoked" event is logged.
  - The type is always suspicious.
  - The severity is alway medium.
  - The metadata contains the address of the Yearn Vault involved.

- NETHFORTA-23-5
  - Fired when the "Update Governance" event is logged.
  - The type is always suspicious.
  - The severity is alway medium.
  - The metadata contains the address of the Yearn Vault involved.

- NETHFORTA-23-6
  - Fired when the "Update Guardian" event is logged.
  - The type is always suspicious.
  - The severity is alway medium.
  - The metadata contains the address of the Yearn Vault involved.
