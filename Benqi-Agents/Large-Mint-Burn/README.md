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

There's no txs including large Mints/Burns on PGL contract. We have deployed a PoC contract to emit the monitored events. The agent behaviour can be verified with the following test transactions (Ropsten), note that `TESTNET_PGL_CONTRACT` should be used instead of `PGL_CONTRACT`:

- 0x212324e7e0909810cbf002414488a7d448a219f5a7e06d824e7b43925287b8bd (`Mint` with regulat amounts - no Finding generated).
- 0xdf20b418ca234228ef4390ccd7d5d391bffaf20209075bfbf0fbe5ba0347fc67 (`Mint` with large QI amount - Finding generated).
- 0xb4f867b6558c371b19b3f16e43468287f0d91e8b156a0b54ff3f3b957fa25ce4 (`Burn` with large QI-WAVAX amounts- Finding generated).
