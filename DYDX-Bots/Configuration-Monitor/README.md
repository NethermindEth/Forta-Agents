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

### Kovan Testnet

> Transactions were generated through our PoC contract deployed on Kovan testnet.
>
> - `Proxy` PoC contract address: `0xffBfe0EcF9ab8FF44a397ab5324A439ea1a617D8`.
> - `StarkPerpetual` PoC contract address: `0x2EbDc46C11EE43596329218Af82FEbE42594Edfa`.

- 0xf334b116b77d968c1ca167543b9503b74ac459a17ec37e8ef911cb74325d895f (`LogGlobalConfigurationRegistered` event)
- 0xde27fd1d4257235d0bf552b8a60497664f3483afa7579d5c61b12ee96358d550 (`LogGlobalConfigurationApplied` event)
- 0xde17d0400a646e7bb6d30a3b1363c655ce1be69379e8db16468e53cc50f78753 (`LogGlobalConfigurationRemoved` event)
