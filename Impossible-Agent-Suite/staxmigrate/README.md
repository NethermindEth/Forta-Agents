# Impossible Finance staxMigrate mint agent

## Description

This agent detects when Impossible Finance tokens are minted through the function `staxMigrate` where the amount of `STAX` tokens input are not the same as the amount of `IF` tokens output

## Supported Chains

- BSC

## Alerts

- IMPOSSIBLE-10
  - Fired when tokens are minted through `staxMigrate` where the `staxMigrate` argument `amount` is different to the `Transfer` argument `value`
  - Severity is always set to "high"
  - Type is always set to "exploit"
  - Metadata:
    - `receiver`:  The address that is receiving the minted tokens
    - `staxAmountIn`: The amount of `STAX` tokens used as input
    - `ifAmountOut`: The amount of `IF` tokens transferred as output

## Test Data

There are no existing transactions where `amount` is different to `value`
The following transaction is a call to `staxMigrate` where `amount` and `value` are the same, this transaction should result in no findings

- 0xe8fe91bd387521aab3b865af6e35f77ae46a70994835fbd5ad4a49cb8442860a (BSC Network)
