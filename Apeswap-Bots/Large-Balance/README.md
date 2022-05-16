
# GNANA Token Large Balance Monitoring Bot

## Description

This bot detects accounts with a large amount of `GNANA` balance.

## Supported Chains

- Binance

## Alerts


- APESWAP-4
  - Fired when balance of the destination account of a transfer is more than threshold percentage of the total supply 
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata includes:
    * `account`: The account that is receiving the tokens
    * `balance`: Balance of the account


## Test Data

In order to use the `PoC GnanaTokens Contracts`: 
1. Set the `isTestnet` variable to `true` in `src/utils.ts`. 
2. Change the `jsonRpcUrl` in `forta.config.json` to `https://data-seed-prebsc-1-s1.binance.org:8545/`.

### Binance Testnet

The bot behaviour can be verified with the following command:

- npm run range 19243883..19243884 
