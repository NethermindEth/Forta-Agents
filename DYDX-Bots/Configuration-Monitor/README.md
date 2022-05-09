# Global configuration monitor

## Description

This bot detects changes in the global configuration hash on dYdX perpetual exchange.

## Supported Chains

- Ethereum

## Alerts

- DYDX-3-1

  - Fired when `LogGlobalConfigurationRegistered` event is emitted on the perpetual contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `ConfigHash`: hash of the registered global configuration.

- DYDX-3-2

  - Fired when `LogGlobalConfigurationApplied` event is emitted on the perpetual contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `ConfigHash`: hash of the applied global configuration.

- DYDX-3-3

  - Fired when `LogGlobalConfigurationRemoved` event is emitted on the perpetual contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `ConfigHash`: hash of the removed global configuration.

## Test Data

The bot behaviour can be verified with the following transactions:

### Mainnet

- 0xfae8cd14d464e8a22d829c579b52a85ebb34ad880e4988022c2785be6c4c9afd (`LogGlobalConfigurationRegistered` event)
- 0x537eb31c5d265e25c993c75b9716042758a9fedfcd4dd47e8439936781f55fdc (`LogGlobalConfigurationApplied` event)

### Ropsten Testnet

> Transactions were generated through our PoC contract deployed on Ropsten testnet.
>
> - `Proxy` PoC contract address: `0xCD8Fa8342D779F8D6acc564B73746bF9ca1261C6`.
> - `StarkPerpetual` PoC contract address: `0x053D3E23084b18867F4eDd46A02eb80E583aeCC7`.

- 0xced12eb03c0f5d3bc1f2c7fc341207b6b07ce7b80290bfe36118fb428d79de93 (`LogGlobalConfigurationRegistered` event)
- 0x3e3edfdb159f1083e3f0a05e69ca53661ad8948a39eec62908c74fa3b4703e91 (`LogGlobalConfigurationApplied` event)
- 0x0f1f9946ea28257c94bc312b71890759e553b6ff33786e60e2e07cb75c290635 (`LogGlobalConfigurationRemoved` event)
