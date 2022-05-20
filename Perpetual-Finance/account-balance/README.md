# Forta Perp.Fi Suite

Forta bot suite to monitor Perpetual Finance.

## Description

This bot monitors account balances of Perpetual Finance (Perp.Fi).

## Supported Chains

- Ethereum Rinkeby

## Alerts

<!-- -->
- AE-PERPFI-LOW-ACCOUNT-BALANCE
  - Fired when an account in account-addresses.json has a balance lower than the threshold set in agent-config.json
  - Severity is always set to "critical"
  - Type is always set to "degraded"
  - Metadata field contains account name, account balance, and threshold

## Test Data

To run all of the tests for this bot, use the following command: `npm run test`
