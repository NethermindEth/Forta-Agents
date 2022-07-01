
# GNANA Token Large Balance Monitoring Bot

## Description

This bot detects accounts with a large amount of `GNANA` balance.

## Supported Chains

- BNB Smart Chain

## Alerts

- APESWAP-4
  - Fired when balance of the destination account of a transfer is more than threshold percentage of the total supply. 
  - Severity is always set to "Info". 
  - Type is always set to "Info". 
  - Metadata includes:
    * `account`: The account that is receiving the tokens.
    * `balance`: Balance of the account.


## Test Data

The bot behaviour can be verified in the following block (**BSC Testnet**):

- 19243883
