# Large PGL Mint-Burn Agent

## Description

This agent detects Mints and Burns on PGL contract with large QI-WAVAX amounts.

> Large is defined as a percent of the token reserve.

## Supported Chains

- Avalanche

## Alerts

- BENQI-8-1

  - Fired when a `Mint` event is emitted on PGL contract with a large QI or WAVAX amount.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `source`: address of the user initializing the Mint.
    - `amount0`: amount of `QI` tokens that were Minted.
    - `amount1`: amount of `WAVAX` tokens that were Minted.

- BENQI-8-2

  - Fired when a `Burn` event is emitted on PGL contract with a large QI or WAVAX amount.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `source`: address of the user initializing the Burn.
    - `amount0`: amount of `QI` tokens that were Burned.
    - `amount1`: amount of `WAVAX` tokens that were Burned.
    - `to`: address to which the tokens were transfered.

## Test Data

The agent behaviour can be verified with the following transactions:
