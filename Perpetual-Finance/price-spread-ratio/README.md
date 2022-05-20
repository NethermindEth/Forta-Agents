# Forta Perp.Fi Suite

Forta bot suite to monitor Perpetual Finance.

## Description

This bot monitors price spread ratio between the Perpetual Finance (Perp.Fi) price and the FTX price.

## Supported Chains

- Ethereum Rinkeby

## Alerts

<!-- -->
- AE-PERPFI-PRICE-SPREAD-RATIO
  - Fired when the price spread ratio between the Perpetual Finance price and the FTX price exceed a threshold for a period of time
  - Severity is always set to "critical"
  - Type is always set to "degraded"
  - Metadata field contains Perp.Fi account name, account address, price spread ratio, lower limit, upper limit, time threshold, and time that price has been outside limits

## Test Data

To run all of the tests for this bot, use the following command: `npm run test`
