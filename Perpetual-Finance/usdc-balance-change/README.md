# Forta Perp.Fi Suite

Forta bot suite to monitor Perpetual Finance.

## Description

This bot monitors USDC balance change of contracts at Perpetual Finance (Perp.Fi).
## Supported Chains

- Ethereum Rinkeby

## Alerts

<!-- -->
- AE-PERPFI-USDC-BALANCE-CHANGE
  - Fired when the USDC balance of a contract or account changes by 10% or more within
    approximately 1 minute
  - Severity is always set to "critical"
  - Type is always set to "suspicious"
  - Metadata field contains account/contract address, USDC balance, and percentage change

## Test Data

To run all of the tests for this bot, use the following command: `npm run test`
