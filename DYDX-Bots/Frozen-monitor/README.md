# Frozen state monitor

## Description

This bot detects frozen state changes in dYdX perpetual exchange contract.

> Perpetual contract : `0xD54f502e184B6B739d7D27a6410a67dc462D69c8`.

## Supported Chains

- Ethereum

## Alerts

- DYDX-2-1

  - Fired when `LogFrozen` event is emitted on dYdX perpetual exchange contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `from`: address running the transaction where the event was emitted.

- DYDX-2-2
  - Fired when `LogUnFrozen` event is emitted on dYdX perpetual exchange contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `from`: address running the transaction where the event was emitted.

## Test Data

The bot behaviour can be verified with the following test transactions generated through our `PoC` contracts (Ropsten):

- `Proxy` PoC contract address: `0xCD8Fa8342D779F8D6acc564B73746bF9ca1261C6`.
- `StarkPerpetual` PoC contract address: `0x16A92ffA189C7Eff51634e743C50f02C29Fb69B2`.

- 0x20ad12967a6cac915d432720652420448d9eb4d1f766c2102c6594cbc80ca1c0 (`LogFrozen` event)
- 0xc163a95b8701681b2b6006f6e27d56387c29f3df76fbd559c75c34bb95814956 ( `LogUnFrozen` event)
