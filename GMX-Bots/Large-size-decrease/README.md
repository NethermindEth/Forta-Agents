# Closing/Decreasing large size position bot

## Description

This bot detects the closing of a position or decrease in an existing position in GMX vault when the
`sizeDelta` is considered large.

> The threshold `LARGE_LIMIT` of what is considered large, can be adjusted in **src/utils.ts**.

## Supported Chains

- Arbitrum
- Avalanche

## Alerts

- GMX-2-1

  - Fired when a `DecreasePosition` and `ClosePosition` event with the same `key` and `sizeDelta` is emitted with `sizeDelta` that exceed the threshold `LARGE_LIMIT`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `GMX`: The address of GMX Vault contract.
    - `Account`: The address of the position owner.
    - `Position size`: The size of the closed position.
    - `Position key`: The key of the closed position.

- GMX-2-2
  - Fired when only a `DecreasePosition` event is emitted with `sizeDelta` that exceed the threshold `LARGE_LIMIT`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `GMX`: The address of GMX Vault contract.
    - `Account`: The address of the position owner.
    - `Position decrease`: The decrease in size of the position.
    - `Position key`: The key of the position.

## Test Data

The bot behaviour can be verified with the following transaction:

- [0xce98d63712a45d3cc5b7369b5548217eff454949ae8b618860d71162b41d921e](https://arbiscan.io/tx/0xce98d63712a45d3cc5b7369b5548217eff454949ae8b618860d71162b41d921e)

  > `LARGE_LIMIT` should be set to <= 50000 for this test transaction.

- [0xa5f7db729f225c5b6099d24cf5f9f29bab81481bd0a64fa46cfbfa7f783fc8b6](https://arbiscan.io/tx/0xa5f7db729f225c5b6099d24cf5f9f29bab81481bd0a64fa46cfbfa7f783fc8b6)

  > `LARGE_LIMIT` should be set to <= 7000 for this test transaction.

- [0x5d3510969d786adaed50d4f21fe73916f39cb9465910f6e0cd2571815c599cb0](https://snowtrace.io/tx/0x5d3510969d786adaed50d4f21fe73916f39cb9465910f6e0cd2571815c599cb0)
  > `LARGE_LIMIT` should be set to <= 29000 for this test transaction.
