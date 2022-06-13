# Unusual PnL when closing a position detection bot

## Description

This bot detects unusual `realisedPnL` based on the account's profit ratio, relative to both the `collateral` and `leverage`, when closing the position.

> The threshold `UNUSUAL_LIMIT` and `HIGH_PNLTOSIZE`of what is considered unusual and high pnl to size respectively, can be adjusted in **src/utils.ts**.

## Supported Chains

- Arbitrum
- Avalanche

## Alerts

- GMX-6

  - Fired when a `ClosePosition` event is emitted with a `realisedPnL` that exceeds the threshold `UNUSUAL_LIMIT` and the `realisedPnL` divided by the position `size` exceeds the threshold `HIGH_PNLTOSIZE`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `GMX`: The address of GMX Vault contract.
    - `Realised PnL`: The realisedPnl of the closed position.
    - `Position size`: The size of the closed position.
    - `Position key`: The key of the closed position.

## Test Data

The bot behaviour can be verified with the following transaction:

- [0x72fe407b5c417f2e7f61aeaf471d61c8922f2ca3135367e99914657929d8ef4d](https://arbiscan.io/tx/0x72fe407b5c417f2e7f61aeaf471d61c8922f2ca3135367e99914657929d8ef4d)

  > `UNUSUAL_LIMIT` should be set to <= 33000 for this test transaction.
  > `HIGH_PNLTOSIZE` should be set to <= 1.1 for this test transaction.

- [0xcd7d56b1dcafab09120e1f2a24236164437d1c520554a5a82a29304b766aa801](https://snowtrace.io/tx/0xcd7d56b1dcafab09120e1f2a24236164437d1c520554a5a82a29304b766aa801)
  > `UNUSUAL_LIMIT` should be set to <= 24000 for this test transaction.
  > `HIGH_PNLTOSIZE` should be set to <= 2.8 for this test transaction.
