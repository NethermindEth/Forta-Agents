# Pools Drained

## Description

This bot try to detects Uniswap V2/V3 pools being drained.

## Supported Chains

- Ethereum

## Alerts

- NETHFORTA-UNI
  - Fired when a transaction contains a Uniswap pool with an amount of token transfers over the expected amount given the pool interactions executed in it.
  - Severity is always set to "Critical"
  - Type is always set to "Suspicious"
  - Metadata contains
    - `pairs`: The list of pools that migh have been drained in the transaction.

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x81e9918e248d14d78ff7b697355fd9f456c6d7881486ed14fdfb69db16631154 (USDT-TCR drained)
