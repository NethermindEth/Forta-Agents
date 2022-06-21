# Balancer Large Flash Loan Bot

## Description

This bot detects large flash loans (i.e. the amount of tokens borrowed is a significant fraction of the Vault's balance
for that token) in the Balancer protocol.

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-4
  - Fired when a Balancer flash loan is "large"
  - Severity is always set to "unknown"
  - Type is always set to "info"
  - Metadata:
    - `recipient`: The flash loan recipient
    - `token`: The borrowed token address
    - `amount`: The amount borrowed
    - `tvlPercentage`: The percentage of the Vault's token balance that was borrowed

## Test Data
