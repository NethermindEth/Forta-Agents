# Flash Swap Alert Agent

## Description

This agent detects flash swaps occuring on the PGL contract.

## Supported Chains

- Avalanche

## Alerts

- BENQI-9
  - Fired when a flash swap occurs on the PGL contract via `swap` function.
  - Severity is always set to "Info."
  - Type is always set to "Info."
  - Metadata includes:
    - `amount0Out`: first token sent to `to`.
    - `amount1Out`: second token sent to `to`.
    - `to`: recipient address of both tokens above.

## Test Data

Token, `TestQi`, deployed at this address: [0x239eF3B9093fA5fF22a3856aa4bF75EB62072dfA](https://testnet.snowtrace.io/address/0x239eF3B9093fA5fF22a3856aa4bF75EB62072dfA).

Token, `TestWAVAX`, deployed at this address: [0xf7419fCEC6Fa5ac3d0E1f5B55c2ea84789bc16A1](https://testnet.snowtrace.io/address/0xf7419fCEC6Fa5ac3d0E1f5B55c2ea84789bc16A1).

Factory, `TestFactory`, deployed at this address: [0x9cE22a5b57ABE2920e04397238F683273788e4C9](https://testnet.snowtrace.io/address/0x9cE22a5b57ABE2920e04397238F683273788e4C9).

Pair, `TestPair`, deployed at this address: [0xF760C7483d15DDBb6DB1F379611715B4E6A0287b](https://testnet.snowtrace.io/address/0xf760c7483d15ddbb6db1f379611715b4e6a0287b).

Flash swap, `TestFlashSwap`, deployed at this address: [0x74C273700b6701121Ed924ad35e0410A53d5D6E3](https://testnet.snowtrace.io/address/0x74C273700b6701121Ed924ad35e0410A53d5D6E3)