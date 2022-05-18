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

## Test Data (Kovan testnet)

The bot behaviour can be verified with the following test transactions,generated through our PoC contracts deployed on Kovan testnet:

> - `TestToken` contract address: `0x127D02DF38Ea031a4EBb6f4b225176a66e004F2e`.
> - `TestModule`contract address: `0xE719C2aB1256e5b68C4F1Da1fbf6c0771dBbB501`.

> To get the expected findings, please update `THRESHOLD_PERCENTAGE` in `utils.ts` accordingly.

- 0x55abfe86bc0ad1b58db4c2bedeac428c23d6cbf7f0623130d885edd7496580a3 ( generates a finding with a percentage of 25 or less)
- 0xdc4f8a068dea35bdf4d18882cc74c516678224e99c3fbf4048fd889d1afb3cfb ( generates a finding with a percentage of 20 or less)
- 0x1f58d6c189b946c26e87471dd9fd692ce80069c1be6bd2b5d782fce80badd707 ( generates a finding with a percentage of 10 or less)
