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
> To test the transactions, `PERPETUAL_PROXY` should be changed to `TEST_PROXY` in `agent.ts` Line 48.

- 0x16acf4518c6df30592d61d99f638b950da3cfd53739442e135c12fd6b2f19101 (`LogOperatorAdded` event)
- 0xd29099f03f7797e49d2689e127df119df5d4cb6b43329ed5687865f8e2ed23b5 ( `LogOperatorRemoved` event)
