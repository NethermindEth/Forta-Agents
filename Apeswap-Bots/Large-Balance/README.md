
# GNANA Token Large Balance Agent

## Description

This agent detects accounts with large amount of `GNANA` balance.

## Supported Chains

- Binance

## Alerts


- APESWAP-4
  - Fired when balance of the destination account of a transfer is more than threshold percentage of the total supply 
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata includes:
    * `account`: The account that is receiving the tokens
    * `balance`: Balance of the account


## Test Data

The agent behaviour can be verified with the following transactions:
- 0x834343c567f3e22fb2a746130cc94430380035ba36c2ff52f866c8707f726620
