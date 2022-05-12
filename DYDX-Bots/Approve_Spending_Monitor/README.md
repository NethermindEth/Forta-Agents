# Spending Approval monitor

## Description

This bot detects large spending approvals on dYdX Liquidity and Safety modules.

> Large is set as a percentage of the total staked tokens for each module.
> The percentage can be ajusted by updating `THRESHOLD_PERCENTAGE` in `utils.ts`.

## Supported Chains

- Ethereum

## Alerts

- DYDX-19-1

  - Fired when `Approval` event is emitted on Liquidity Module with a large `value`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `value`: amount of tokens that is approved to be spent.
    - `owner`: address of the approved tokens owner.
    - `spender`: address approved to spend the tokens.

- DYDX-19-2

  - Fired when `Approval` event is emitted on Safety Module with a large `value`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `value`: amount of tokens that is approved to be spent.
    - `owner`: address of the approved tokens owner.
    - `spender`: address approved to spend the tokens.

## Test Data

The bot behaviour can be verified with the following transactions:
