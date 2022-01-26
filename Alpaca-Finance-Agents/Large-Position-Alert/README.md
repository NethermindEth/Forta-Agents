# Large Position Agent

## Description

This agent detects `Work` event emission from the `Vault` contract when the `loan` meets any of the following criteria:
  - More than 300 WBNB
  - More than 100,00 BUSH
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
    - `vault`: Address of `Vault` the position is taken in.

## Test Data

The agent behaviour can be verified with the following transactions:

- [0xeda7ba552147a8a33f9f9b964c9d54605a1d20bcfc4d20e0c41cb6803f58246d](https://bscscan.com/tx/0xeda7ba552147a8a33f9f9b964c9d54605a1d20bcfc4d20e0c41cb6803f58246d) (`loan` amount was ~239K BUSD)
