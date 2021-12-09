# Pool Migration agent

## Description

This agent detects calls to `migrate_to_new_pool` function in `PoolMigrator` Contract.

## Supported Chains

- Ethereum

## Alerts

- CURVE-3
  - Fired when `migrate_to_new_pool` function is called
  - Severity is always set to "medium"
  - Type is always set to "unknown"
  - Metadata contains:
    - `oldPool`: Address of the pool to migrate from
    - `newPool`: Address of the pool to migrate into
    - `amount`: Number of `oldPool` LP tokens to migrate

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x57a2be1ce14d6a2b78dca2980f0f2410aacf75f2e9cdaaf9d09eeba8fd4a2b82 (successful `migrate_to_new_pool` call)
- 0x88e002177f0b0bc4becd0fc21c7445eb915c9879915ef7cf61fee15f43c9c809 (reverted `migrate_to_new_pool` call)