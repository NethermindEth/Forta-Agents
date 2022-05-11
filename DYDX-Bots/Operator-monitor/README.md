# DYDX Operator monitor

## Description

This bot detects when an operator is added or removed from dydx perpetual exchange

> Perpetual proxy contract: `0xD54f502e184B6B739d7D27a6410a67dc462D69c8`.

## Supported Chains

- Ethereum

## Alerts

- DYDX-4-1

  - Fired when `LogOperatorAdded` event is emitted on dydx perpetual contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `operator`: Address of the operator that was added.

- DYDX-4-2

  - Fired when `LogOperatorRemoved` event is emitted on dydx perpetual contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `operator`: Address of the operator that was removed.

## Test Data

The bot behaviour can be verified with the following transactions:

### Mainnet

- 0x58cf4814925be98279803694aef144e1d9f6bc24ebc98547f54ea27858d65286 (`LogOperatorAdded` event)
- 0xb4708af9f63e3145441159d75bff4fa4b29064dadfcfa9176a294842e1cd5631 ( `LogOperatorRemoved` event)

### Ropsten Testnet

> Transactions were generated through our PoC contract deployed on Ropsten testnet.

> - `Proxy` PoC contract address: `0xffBfe0EcF9ab8FF44a397ab5324A439ea1a617D8`.
> - `StarkPerpetual` PoC contract address: `0x56205FcEC6732F8FCe42FB0Fb4567a97EdCbAabD`.

- 0xc160c46c5efb83c369c375698fd1a08d0889799ff7ee0ddcce77aaaec92b7b26 (`LogOperatorAdded` event)
- 0xe2af2d20c4369dd4b5473b2d1ceb421c1fb228103a1c42611a0d4ca114aa3256 ( `LogOperatorRemoved` event)
