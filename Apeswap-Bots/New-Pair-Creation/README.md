# New Pair Creation

## Description

This bot detects the creation of new tradable pair on Apeswap

## Supported Chains

- Binance Smart Chain



## Alerts

- APESWAP-8
  - Fired when a transaction creates a new tradable pair on Apeswap's ApeFactory contract
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains the following fields: 
    - `token-A address`: contract address of the first token of the created pair
    - `token-B address`: contract address of the second token of the created pair
    

## Test Data

The bot behaviour can be verified with the following transaction:

- [0xb236dad0d7201a9acc1aa2fd2218ecdbd36cbe6f4f961fd4565847f459576eca](https://www.bscscan.com/tx/0xb236dad0d7201a9acc1aa2fd2218ecdbd36cbe6f4f961fd4565847f459576eca)

