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

The bot behaviour can be verified with the following test transactions generated through our `PoC` contracts (Kovan):

> - `Proxy` PoC contract address: `0xffBfe0EcF9ab8FF44a397ab5324A439ea1a617D8`.
> - `StarkPerpetual` PoC contract address: `0x3402a6C2Aa36430907E2686737eB4d6467845Ccf`.

- 0x6d38353a43c49fdb9ca8cbfa1b7557fe64765f088b9403ab50e02d21c1b86e49 (`LogFrozen` event)
- 0x9ac3f8019ef2db1485015e8a8054138968dddf3700ed8a22e883caf726c44b46 ( `LogUnFrozen` event)
