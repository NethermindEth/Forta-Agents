# BankerJoe large transfers

## Description

This bot detects `Borrow`, `Mint` and `Redeem` events on BankerJoe markets with a large amount.
Large is set as a percentage of the total supply of the market (jToken).

> - Percentage can be ajusted by changing `PERCENTAGE` on `utils.ts L03` .

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

## Test Data (Kovan)

The bot behaviour can be verified with our PoC contracts deployed on Kovan testnet:

#### PoC contracts

- `TestJoeTroller`: 0x63EAb8eB0af289452d493c1d0a2Cc83809cfc056.
- `TestMarket`: 0x9307E758FeAC2a8bc7790F5108fE296872aE6987.

#### Test transactions

- 0x48939057e818717dbd7282f57cf75db3eb1c56fcb0244ac9115991c807483736 (large `Mint`).

  - `mintAmount`: 200000000000000000000( 20% of total supply).
  - generates a finding with a percentage less than or equals to `20%`.

- 0x855bb07436d79d52bd252bf7a95d9d72c548054cd89656fd4b3e01f0ade3847e ( large `Borrow`).

  - `borrowAmount`: 250000000000000000000( 25% of total supply).
  - generates a finding with a percentage less than or equals to `25%`.

- 0xc54f35a182ed53eb98bb0ad4a730dbdbc94278b6fb13b14a5e8d9262cafe9695 ( large `Redeem`).

  - `redeemAmount`: 300000000000000000000( 30% of total supply).
  - generates a finding with a percentage less than or equals to `30%`.
