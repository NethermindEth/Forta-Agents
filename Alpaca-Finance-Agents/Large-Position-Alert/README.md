# Large Position Agent

## Description

This agent detects `Work` event emission from the `Vault` contract when the `loan` meets any of the following criteria:
  - More than 300 WBNB
  - More than 100,00 BUSD
  - More than 30 ETH
  - More than 3 BTCB
  - More than 100,000 USDT
  - More than 200,000 ALPACA
  - More than 100,000 TUSD

## Supported Chains

- Binance Smart Chain (BSC)

## Alerts

- ALPACA-1
  - Fired when `Work` event is emitted with `loan` meeting any of the previously stated criteria.
  - Severity is always set to "Info."
  - Type is always set to "Info."
  - Metadata contains:
    - `id`: Id of the target position.
    - `loan`: Amount to borrow from the vault.
    - `vault`: Address of the `Vault` which houses the position.

## Test Data

The agent behaviour can be verified with the following transactions:

- [0x811dc77a060dab7fe6fb06718f13a3abfc425a12f85867a2f2224c54e19a3266](https://www.bscscan.com/tx/0x811dc77a060dab7fe6fb06718f13a3abfc425a12f85867a2f2224c54e19a3266) (`loan` amount was ~631K BUSD)
