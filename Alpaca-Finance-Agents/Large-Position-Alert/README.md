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
  - Severity is always set to "info."
  - Type is always set to "unknown."
  - Metadata contains:
    - `id`: Id of the target position.
    - `loan`: Amount to borrow from the vault.

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x7c14644d678090ed33d780fbf9fe016a26fea4d40af34ec226ffba1e554616ca (Closest `Work` event emission I could find. `loan` amount was ~26K BUSD)
