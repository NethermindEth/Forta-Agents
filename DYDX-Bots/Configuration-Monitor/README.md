# Global configuration monitor

## Description

This bot detects changes in the global configuration hash on dYdX perpetual exchange.

## Supported Chains

- Ethereum

## Alerts

- DYDX-3-1

  - Fired when `LogGlobalConfigurationRegistered` event is emitted on the perpetual contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `ConfigHash`: hash of the registered global configuration.

- DYDX-3-2

  - Fired when `LogGlobalConfigurationApplied` event is emitted on the perpetual contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:

    - `ConfigHash`: hash of the applied global configuration.

- DYDX-3-3
- Fired when `LogGlobalConfigurationRemoved` event is emitted on the perpetual contract.
- Severity is always set to "Info".
- Type is always set to "Info".
- Metadata includes:
  - `ConfigHash`: hash of the removed global configuration.

## Test Data

The agent behaviour can be verified with the following transactions:
