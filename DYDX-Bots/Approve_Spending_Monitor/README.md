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
> - `TestModule`contract address: `0xBB2DAb75CdEc1BAF0564c492EF9171171973Be35`.

> To get the expected findings, please update `THRESHOLD_PERCENTAGE` in `utils.ts` accordingly.

- 0xe93a333506365f310cbe61145335b079f32bd19cd549ae888c704016268c749d ( generates a finding with a percentage of 25 or less)
- 0x3e54fd7a0ddb7c9c01837c39a081bb65a1110e005cf42884cdeac6737f0a8031 ( generates a finding with a percentage of 20 or less)
- 0xfa50b051789295fd0a26fc5a105bc346fb6fa8da912ffdb7804c1c4f04bfadfa ( generates a finding with a percentage of 10 or less)
