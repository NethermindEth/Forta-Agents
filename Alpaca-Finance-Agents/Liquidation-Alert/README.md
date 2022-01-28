# Liquidation Agent & Bad Debt Agent

## Description

`ALPACA-3` agent detects `Kill` event emissions from `Vault` contracts.
`ALPACA-4` agent detects `Kill` event emission from `Vault` contracts when `left` equals zero.

## Supported Chains

- Binance Smart Chain (BSC)

## Alerts

- ALPACA-3
  - Fired when `Kill` event is emitted.
  - Severity is always set to "Info."
  - Type is always set to "Info."
  - Metadata contains:
    - `positionId`: Id of the target position.
    - `positionkiller`: Address that executed the liquidation.
    - `positionOwner`: Address of the owner of the target position.
    - `positionValue`: Value amount of target position.
    - `debt`: Debt value of the target position.
    - `prize`: Combined amount of what is awarded to the liquidator and the treasury fees.
    - `left`: What is returned to the target position's owner after liquidation execution.
    - `vault`: Address of the `Vault` which houses the position.

- ALPACA-4
  - Fired when `Kill` event is emitted and `left` equals zero.
  - Severity is always set to "Info."
  - Type is always set to "Info."
  - Metadata contains:
    - `positionId`: Id of the target position.
    - `positionkiller`: Address that executed the liquidation.
    - `positionOwner`: Address of the owner of the target position.
    - `positionValue`: Value amount of target position.
    - `debt`: Debt value of the target position.
    - `prize`: Combined amount of what is awarded to the liquidator and the treasury fees.
    - `left`: What is returned to the target position's owner after liquidation execution.
    - `vault`: Address of the `Vault` which houses the position.

## Test Data

Agent `ALPACA-3`'s behaviour can be verified with the following transactions:

- [0x57fd681ee9406daf518fef21e90f8d8ed2202ef09f839d0cec7368af168534e8](https://bscscan.com/tx/0x57fd681ee9406daf518fef21e90f8d8ed2202ef09f839d0cec7368af168534e8) (`Kill` event emitted from BUSD Vault)
