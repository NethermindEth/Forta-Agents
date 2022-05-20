# Large BANANA Token Mint

## Description

This bot detects transactions with large BANANA token mints

## Supported Chains

- Binance Smart Chain


## Alerts

Describe each of the type of alerts fired by this agent

- APESWAP-1
  - Fired when a transaction contains a BANANA token mint equals to or greater than half of BANANA token's total supply
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains the following field: 
    - `from`: the address of the initiator of the transaction
    - `to`: BANANA token contract address
    - `value`: the minted amount of BANANA tokens

## Test Data

The agent behaviour can be verified with the following transaction:

- [0x16a4c5bfaae3669b1d45e61726d5fdfdfbec91ac7822b78d6a70db48d4a7ff40](https://testnet.bscscan.com/tx/0x16a4c5bfaae3669b1d45e61726d5fdfdfbec91ac7822b78d6a70db48d4a7ff40) - `PoC Binance Smart Chain Testnet` 

