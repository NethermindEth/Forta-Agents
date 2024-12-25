# Flash Swap Alert Bot

## Description

This bot detects flash swaps occurring on the PGL contract.

## Supported Chains

- Avalanche

## Alerts

- BENQI-9
  - Fired when a flash swap occurs on the PGL contract via `swap` function.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `amount0Out`: first token sent to `to`.
    - `amount1Out`: second token sent to `to`.
    - `to`: recipient address of both tokens above.

## Test Data

Mock `TestPair` contract deployed on the Avalanche testnet at this address: [0x88C80C9d00D9583b252f8151D8489b5A35506e55](https://testnet.snowtrace.io/address/0x88C80C9d00D9583b252f8151D8489b5A35506e55#code).

Transaction that should generate a Finding: [0x7ca549fafac6c8f8d3e1e810bf58bf62d86335c541a07ca8aa955deff36bce73](https://testnet.snowtrace.io/tx/0x7ca549fafac6c8f8d3e1e810bf58bf62d86335c541a07ca8aa955deff36bce73).

Transaction that should NOT generate a Finding: [0x884bf704ce2d960b3d3fd5e3d8542bcdc7a988dcc4473500dba9168bcb116a9a](https://testnet.snowtrace.io/tx/0x884bf704ce2d960b3d3fd5e3d8542bcdc7a988dcc4473500dba9168bcb116a9a).
