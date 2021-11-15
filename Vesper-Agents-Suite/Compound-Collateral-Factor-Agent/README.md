# Detect Updates to `collateralFactorMantissa`

## Description

This agent detects updates to `collateralFactorMantissa` in the Compound Comptroller through the `NewCollateralFactor` event

## Supported Chains

- Ethereum

## Alerts

- VESPER-6
  - Fired when a transaction emits a `NewCollateralFactor` event
  - Severity is always set to "info" 
  - Type is always set to "info"
  - Metadata contains:
    - `mantissa`: the new `collateralFactorMantissa` updated in the event

## Run

Configure the `JSON-RPC` provider in the `forta.config.json` file. Edit the `jsonRpcUrl` property and set it to a websocket provider.

## Tests

```
npm test
```
