# Flash Swap Agent

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