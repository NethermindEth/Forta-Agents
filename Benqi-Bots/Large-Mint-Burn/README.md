# Large PGL Mint-Burn Bot

## Description

This bot detects Mints and Burns on PGL contract with large QI-WAVAX amounts.

> Large is defined as a percent of the token reserve.

## Supported Chains

- Avalanche

## Alerts

- BENQI-8-1

  - Fired when a `Mint` event is emitted on PGL contract with a large QI or WAVAX amount.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `source`: address of the user initializing the Mint.
    - `amount0`: amount of `QI` tokens that were Minted.
    - `amount1`: amount of `WAVAX` tokens that were Minted.

- BENQI-8-2

  - Fired when a `Burn` event is emitted on PGL contract with a large QI or WAVAX amount.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `source`: address of the user initializing the Burn.
    - `amount0`: amount of `QI` tokens that were Burned.
    - `amount1`: amount of `WAVAX` tokens that were Burned.
    - `to`: address to which the tokens were transfered.

## Test Data

There are no transactions including large Mints/Burns on PGL contract. There is a PoC contract deployed to emit the monitored events. The bot behaviour can be verified with the following test transactions (Avalanche testnet):

> note that `provideHandleTransaction` inputs in the default export of `agent.ts` need to be changed to use `TESTNET_PGL_CONTRACT` instead of `PGL_CONTRACT`.

- 0x23cef6f0235e7e8366632ed13a70207d289e1c18bdbe358b2d1bc6ca886ab09d (`Mint` with regular amounts - no Finding generated).
- 0xd805d56437c3596c514512b414d63a972e16b7703287bd88f0051424443cc1ee (`Mint` with large QI amount - Finding generated).
- 0x4079ab4fc50d53de2f531efb76fd46befdd0aeae62f3e1f8e405f5ab863d0846 (`Burn` with large QI-WAVAX amounts - Finding generated).
