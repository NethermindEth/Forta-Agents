# YFI governance changes 

## Description

This agent detects transactions that change the [YFI](https://etherscan.io/token/0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e) token governance address.

## Supported Chains

- Ethereum

## Alerts

- NETHFORTA-27
  - Fired when a transaction change the YFI governance token
  - Severity is always set to "high" 
  - Type is always set to "suspicious" 
  - Metadata contains the old and the new governance addresses
