# Large Swap Bot

## Description

This bot detects swaps from valid pair contracts when any `amount` argument is high.
> Currently, high is set to greater than or equal to `20%`.

## Supported Chains

- Avalanche

## Alerts

- TRADERJOE-03
  - Fired when `Swap` event is emitted with an `amount` argument that exceeds the threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `sender`: Address that initialized swap.
    - `amount0In`: Amount of token0 in.
    - `amount1In`: Amount of token1 in.
    - `amount0Out`: Amount of token0 out.
    - `amount1Out`: Amount of token1 out.
    - `to`: Recipient address.
