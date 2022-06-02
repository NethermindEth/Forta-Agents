# BankerJoe large transfers

## Description

This bot detects `Borrow`, `Mint` and `Redeem` events on BankerJoe markets with a large amount.
Large is set as a percentage of the total supply of the market (jToken).

> - Percentage can be ajusted by changing `PERCENTAGE` on utils.ts.

## Supported Chains

- Avalanche

## Alerts

- TraderJoe-21-1

  - Fired when `Mint` event is detected on a BankerJoe market with a large amount.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `minter`: address suppling assets.
    - `mintAmount`: The amount of the underlying asset supplied by minter.
    - `mintTokens`: The amount of jTokens received by the minter.
  - addresses contains the market address where the event was emitted.

- TraderJoe-21-2

  - Fired when `Redeem` event is detected on a BankerJoe market with a large amount.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `redeemer`: address redeeming jTokens in exchange for the underlying asset.
    - `redeemAmount`: The amount of underlying received.
    - `redeemTokens`: The number of jTokens redeemed.
  - addresses contains the market address where the event was emitted.

- TraderJoe-21-1

  - Fired when `Borrow` event is detected on a BankerJoe market with a large amount.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `borrower`: address borrowing assets.
    - `borrowAmount`: The amount of the underlying asset that was borrowed.
    - `accountBorrows`: The account total borrows.
    - `totalBorrows`: Total amount of outstanding borrows of the underlying in the market.
  - addresses contains the market address where the event was emitted.

## Test Data

The bot behaviour can be verified with the following transactions:
