# Forta Perp.Fi Suite

Forta bot suite to monitor Perpetual Finance.

## Description

This bot monitors failed transactions of Perpetual Finance (Perp.Fi).

## Supported Chains

- Ethereum Rinkeby

## Alerts

<!-- -->
- AE-PERPFI-FAILED-TRANSACTIONS
  - Fired when there are more failed transactions than the specified limit within a specified time window
  - Severity is always set to "critical"
  - Type is always set to "info"
  - Metadata field contains Perp.Fi account name, account address, and list of failed transactions

## Test Data

To run all of the tests for this bot, use the following command: `npm run test`
