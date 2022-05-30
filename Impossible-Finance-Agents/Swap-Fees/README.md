# Impossible Finance - Swap Fee Parameter Updates 

## Description

This bot detects transactions where modifications in fee values of Impossible Finance V3 Pairs occurred.

## Supported Chains

- Binance Smart Chain

## Alerts

- IMPOSSIBLE-6-1
  - Fired when an `UpdatedTradeFees` event is emitted by an Impossible Finance V2 pair
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains:
    - `pair`: Address of the pair emitting the event
    - `oldFee`: Old trade fee value
    - `newFee`: New trade fee value

- IMPOSSIBLE-6-2
  - Fired when an `UpdatedWithdrawalFeeRatio` event is emitted by an Impossible Finance V2 pair
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains:
    - `pair`: Address of the pair emitting the event
    - `oldFee`: Old withdrawal fee ratio
    - `newFee`: New withdrawal fee ratio

## Test Data

The bot behavior can be verfied with the following Binance Smart Chain transaction:

- `0x6b5a8525bf1833354c6197bb11d4fed4a68892dc5f30e2e94f054ff266a859b9` - `UpdatedTradeFees` emission.

The `PoC` factory is deployed at the following address on the ETH Goerlie testnet:
- `0x86f9944711526af414683033E5846E92b721191A`

The bot behavior can be verified with the following ETH Goerli testnet transactions:
- `0x29d2fdf6bedc2817e8eba097727e30fe898aa5e40a526018b9a03500d71edd7d` - `UpdatedWithdrawalFeeRatio` emission.
- `0xf82a592930bb960204d3b82a64b45c215a805dc1a43663642f34b6c51622aa91` - `UpdatedTradeFees` emission.
- `0xa9caacf17c4b9e1a7d96ac667089cd8620ac1cb405afe19fb885a6df39807e30` - `UpdatedTradeFees` emission.
