# Large BANANA Token Mint

## Description

This bot detects transactions with large (> totalSupply/threshold\*) BANANA token mints.

> \*The `threshold` can be configured in `src/utils.ts, L13`.

## Supported Chains

- Binance Smart Chain
- Polygon

## Alerts

- APESWAP-1
  - Fired when BANANA token mint is more than threshold percentage of the total supply.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains the following field:
    - `from`: the address of the initiator of the transaction
    - `to`: BANANA token contract address
    - `value`: the minted amount of BANANA tokens

## Test Data

The bot behaviour can be verified with the following transactions:

- [0x63b996196eaff9bc14983fd9c4fcf9b6d64762b499bd1a78346045291f4535e9](https://www.bscscan.com/tx/0x63b996196eaff9bc14983fd9c4fcf9b6d64762b499bd1a78346045291f4535e9) `Binance Smart Chain Mainnet`

- [0x16a4c5bfaae3669b1d45e61726d5fdfdfbec91ac7822b78d6a70db48d4a7ff40](https://testnet.bscscan.com/tx/0x16a4c5bfaae3669b1d45e61726d5fdfdfbec91ac7822b78d6a70db48d4a7ff40) `PoC Binance Smart Chain Testnet`
